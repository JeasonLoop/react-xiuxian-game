/**
 * Cloudflare 优选 IP 测速 & DNS 更新脚本
 *
 * 用法:
 *   node scripts/cf-ip-optimizer.mjs               # 测速并输出最优 IP
 *   node scripts/cf-ip-optimizer.mjs --update-dns   # 测速并自动更新 DNS
 *
 * 原理:
 *   1. 从公开源获取 Cloudflare IP 段
 *   2. 并发测试每个 IP 的 HTTPS 延迟
 *   3. 按延迟排序，选取最快的 N 个 IP
 *   4. (可选) 通过 DNS API 更新分线路记录
 */

import https from "node:https";
import http from "node:http";
import dns from "node:dns";
import { readFileSync, existsSync } from "node:fs";

// ── 配置 ──
const CONFIG = {
  // 目标域名（用于测试连接，应为你自己的 Worker 域名）
  testHostname: process.env.CF_TEST_HOSTNAME || "xiuxian-game-api.jeasonloop.online",
  // 测试路径（Worker 上的轻量端点）
  testPath: "/api/health",
  // 期望的响应状态码
  expectedStatus: 200,
  // 并发数
  concurrency: 20,
  // 超时 (ms)
  timeout: 5000,
  // 保留的最优 IP 数量
  topN: 5,
  // 最少测试多少个 IP
  minTest: 100,
  // 最大测试多少个 IP
  maxTest: 500,
  // Collector Worker URL（--from-collector 模式使用）
  collectorUrl: process.env.CF_COLLECTOR_URL || "https://xiuxian-bestip-collector.jeasonloop.online",
  // DNS 更新配置
  dns: {
    // 要更新的 DNS 记录
    records: (process.env.CF_DNS_RECORDS || "").split(",").filter(Boolean),
    // DNSPod API（腾讯云）
    dnspod: {
      secretId: process.env.DNSPOD_SECRET_ID || "",
      secretKey: process.env.DNSPOD_SECRET_KEY || "",
      domain: process.env.DNSPOD_DOMAIN || "",      // 如 jeasonloop.online
      subDomain: process.env.DNSPOD_SUB_DOMAIN || "", // 如 xiuxian-api
    },
    // Cloudflare API（如果域名在 CF）
    cloudflare: {
      apiToken: process.env.CF_API_TOKEN || "",
      zoneId: process.env.CF_ZONE_ID || "",
      recordName: process.env.CF_RECORD_NAME || "",
    },
  },
};

// ── 获取 Cloudflare IP 列表 ──
const CF_IP_SOURCES = [
  "https://www.cloudflare.com/ips-v4/",
  "https://www.cloudflare.com/ips-v6/",
];

async function fetchCFIPRanges() {
  /** @type {string[]} */
  const allIPs = [];

  for (const url of CF_IP_SOURCES) {
    try {
      console.log(`  获取 IP 段: ${url}`);
      const resp = await fetch(url);
      const text = await resp.text();
      const cidrs = text
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith("#"));

      for (const cidr of cidrs) {
        const ips = expandCIDR(cidr);
        allIPs.push(...ips);
      }
      console.log(`    → ${cidrs.length} 个 CIDR 段`);
    } catch (e) {
      console.error(`  获取失败: ${e.message}`);
    }
  }

  return allIPs;
}

// ── CIDR 展开（仅支持 /24 及更大，避免展开太多 IP）──
function expandCIDR(cidr) {
  const [base, prefixLen] = cidr.split("/");
  const prefix = parseInt(prefixLen, 10);

  // IPv6 暂不展开，直接返回 CIDR（后续测试逐 IP）
  if (base.includes(":")) {
    // 太大，采样
    return [cidr];
  }

  // IPv4: /24 以下才展开，/16~23 随机采样 32 个
  const parts = base.split(".").map(Number);
  const ipBase = (parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3];
  const mask = ~((1 << (32 - prefix)) - 1);
  const network = ipBase & mask;
  const count = 1 << (32 - prefix);

  if (count <= 256) {
    // /24 及以上，全部展开
    const ips = [];
    for (let i = 1; i < count - 1; i++) {
      const ip = network + i;
      ips.push(
        `${(ip >> 24) & 0xff}.${(ip >> 16) & 0xff}.${(ip >> 8) & 0xff}.${ip & 0xff}`
      );
    }
    return ips;
  } else {
    // 大网段，随机采样
    const ips = [];
    const sampleCount = Math.min(count - 2, 64);
    const seen = new Set();
    while (ips.length < sampleCount) {
      const offset = 1 + Math.floor(Math.random() * (count - 2));
      if (seen.has(offset)) continue;
      seen.add(offset);
      const ip = network + offset;
      ips.push(
        `${(ip >> 24) & 0xff}.${(ip >> 16) & 0xff}.${(ip >> 8) & 0xff}.${ip & 0xff}`
      );
    }
    return ips;
  }
}

// ── 测试单个 IP 的延迟 ──
function testIP(ip, hostname, path, timeout, expectedStatus) {
  return new Promise((resolve) => {
    const start = Date.now();
    const req = https.request(
      {
        hostname: ip,
        port: 443,
        path,
        method: "GET",
        servername: hostname, // SNI
        headers: { Host: hostname },
        rejectUnauthorized: false, // IP 直连，证书域名不匹配是正常的
        timeout,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          const elapsed = Date.now() - start;
          resolve({
            ip,
            elapsed,
            status: res.statusCode,
            ok: res.statusCode === expectedStatus,
          });
        });
      }
    );

    req.on("error", () => {
      resolve({ ip, elapsed: -1, status: 0, ok: false });
    });
    req.on("timeout", () => {
      req.destroy();
      resolve({ ip, elapsed: -1, status: 0, ok: false });
    });

    req.end();
  });
}

// ── 批量测速 ──
async function runSpeedTest(ips, hostname, path, timeout, expectedStatus, concurrency) {
  const results = [];
  const total = Math.min(ips.length, CONFIG.maxTest);
  const testIPs = ips.slice(0, total);

  console.log(`\n  开始测速: ${testIPs.length} 个 IP (并发: ${concurrency})`);

  let tested = 0;
  let passed = 0;

  // 分批并发
  for (let i = 0; i < testIPs.length; i += concurrency) {
    const batch = testIPs.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map((ip) => testIP(ip, hostname, path, timeout, expectedStatus))
    );

    for (const r of batchResults) {
      tested++;
      if (r.ok && r.elapsed > 0) {
        passed++;
        results.push(r);
      }
    }

    // 进度
    if (tested % 50 === 0 || i + concurrency >= testIPs.length) {
      process.stdout.write(
        `\r  进度: ${tested}/${testIPs.length} | 通过: ${passed} | 当前最快: ${results.length > 0 ? Math.min(...results.map((r) => r.elapsed)) + "ms" : "N/A"}`
      );
    }
  }
  console.log("");

  // 按延迟排序
  results.sort((a, b) => a.elapsed - b.elapsed);
  return results;
}

// ── 打印结果 ──
function printResults(results, topN) {
  const top = results.slice(0, topN);
  console.log(`\n╔══════════════════════════════════════════════════════╗`);
  console.log(`║           ☁️  Cloudflare 优选 IP 测速结果            ║`);
  console.log(`╠══════════════════════════════════════════════════════╣`);
  console.log(`║  排名  │ IP 地址          │ 延迟      │ 状态        ║`);
  console.log(`╠══════════════════════════════════════════════════════╣`);

  top.forEach((r, i) => {
    const rank = String(i + 1).padStart(4);
    const ip = r.ip.padEnd(16);
    const ms = `${r.elapsed}ms`.padStart(8);
    const status = "✅ 通过".padEnd(10);
    console.log(`║  ${rank}  │ ${ip} │ ${ms}   │ ${status}║`);
  });

  console.log(`╚══════════════════════════════════════════════════════╝`);

  return top;
}

// ── 从 Collector Worker 获取优选 IP ──
async function fetchIPsFromCollector(collectorUrl) {
  console.log(`\n  从 Collector 获取优选 IP: ${collectorUrl}/fast-ips`);
  try {
    const resp = await fetch(`${collectorUrl}/fast-ips`);
    if (!resp.ok) {
      console.error(`  ✗ Collector 返回 ${resp.status}`);
      return [];
    }
    const data = await resp.json();
    const fastIPs = data.fastIPs || [];
    console.log(`  ✅ 获取到 ${fastIPs.length} 个优选 IP`);
    // 转换为 speed test 结果格式
    return fastIPs.map((item) => ({
      ip: item.ip,
      elapsed: item.latency || 0,
      status: 200,
      ok: true,
    }));
  } catch (e) {
    console.error(`  ✗ 获取失败: ${e.message}`);
    return [];
  }
}

// ── DNS 更新 ──

// 更新 DNSPod (腾讯云) 记录
async function updateDNSPod(ips, config) {
  const { secretId, secretKey, domain, subDomain } = config.dnspod;
  if (!secretId || !secretKey || !domain) {
    console.log("\n  ⚠  DNSPod 未配置，跳过 DNS 更新");
    console.log("     设置环境变量: DNSPOD_SECRET_ID, DNSPOD_SECRET_KEY, DNSPOD_DOMAIN, DNSPOD_SUB_DOMAIN");
    return;
  }

  console.log(`\n  🔄 更新 DNSPod DNS 记录: ${subDomain}.${domain}`);
  console.log(`     新 IP: ${ips.map((r) => r.ip).join(", ")}`);

  // 腾讯云 API v3 签名
  // 注: 这里需要根据实际使用的 DNS 提供商调整
  // 以下是 DNSPod API 的示例框架
  console.log("  ⚠  DNSPod API 更新需要完整实现签名逻辑");
  console.log("     参考: https://cloud.tencent.com/document/api/1427/56166");
}

// 更新 Cloudflare DNS 记录（支持多 IP）
async function updateCloudflareDNS(ips, config) {
  const { apiToken, zoneId, recordName } = config.cloudflare;
  if (!apiToken || !zoneId || !recordName) {
    console.log("\n  ⚠  Cloudflare DNS API 未配置，跳过 DNS 更新");
    console.log("     设置环境变量: CF_API_TOKEN, CF_ZONE_ID, CF_RECORD_NAME");
    return;
  }

  console.log(`\n  🔄 更新 Cloudflare DNS 记录: ${recordName}`);

  try {
    // 查找现有 A 记录
    const listResp = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?type=A&name=${recordName}`,
      { headers: { Authorization: `Bearer ${apiToken}`, "Content-Type": "application/json" } }
    );
    const listData = await listResp.json();
    if (!listData.success) {
      console.error("  ✗ 查询 DNS 记录失败:", listData.errors);
      return;
    }

    const existing = listData.result;
    const bestIPs = ips.slice(0, CONFIG.topN);

    // 删除所有旧 A 记录
    for (const rec of existing) {
      await fetch(
        `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${rec.id}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${apiToken}` } }
      );
      console.log(`  🗑 已删除旧记录: ${rec.name} → ${rec.content}`);
    }

    // 创建新记录（多个 IP 做 DNS 轮询）
    for (let i = 0; i < bestIPs.length; i++) {
      const ip = bestIPs[i].ip;
      const createResp = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${apiToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({ type: "A", name: recordName, content: ip, ttl: 120, proxied: false }),
        }
      );
      const createData = await createResp.json();
      if (createData.success) {
        console.log(`  ✅ [${i + 1}/${bestIPs.length}] ${recordName} → ${ip} (TTL: 120, DNS only)`);
      } else {
        console.error(`  ✗ [${i + 1}] 创建失败:`, JSON.stringify(createData.errors));
      }
    }
  } catch (e) {
    console.error("  ✗ Cloudflare API 错误:", e.message);
  }
}

// ── 主流程 ──
async function main() {
  const args = process.argv.slice(2);
  const shouldUpdateDNS = args.includes("--update-dns");
  const fromCollector = args.includes("--from-collector");

  console.log("╔══════════════════════════════════════════╗");
  console.log("║   ☁️  Cloudflare 优选 IP 测速工具       ║");
  console.log("╚══════════════════════════════════════════╝");
  console.log(`  模式: ${fromCollector ? "Collector API" : "本地测速"}`);
  console.log(`  目标: ${fromCollector ? CONFIG.collectorUrl : CONFIG.testHostname}`);
  console.log(`  保留最优: ${CONFIG.topN} 个 IP`);
  console.log(`  DNS 更新: ${shouldUpdateDNS ? "是" : "否（仅输出）"}`);

  let results = [];

  if (fromCollector) {
    // ── Collector 模式：从 Collector Worker API 获取优选 IP ──
    console.log("── 从 Collector 获取优选 IP ──");
    results = await fetchIPsFromCollector(CONFIG.collectorUrl);

    if (results.length === 0) {
      console.error("\n  ✗ Collector 未返回可用 IP");
      process.exit(1);
    }

    console.log("── 结果 ──");
    const top = printResults(results, CONFIG.topN);

    console.log("\n  📋 DNS A 记录（可直接复制）:");
    top.forEach((r, i) => {
      console.log(`     ${CONFIG.testHostname}  →  ${r.ip}  (${r.elapsed}ms)`);
    });

    if (shouldUpdateDNS) {
      if (CONFIG.dns.cloudflare.apiToken) await updateCloudflareDNS(top, CONFIG);
      if (CONFIG.dns.dnspod.secretId) await updateDNSPod(top, CONFIG);
    }
  } else {
    // ── 本地测速模式 ──
    // 1. 获取 IP 列表
    console.log("\n── 1/3 获取 Cloudflare IP 段 ──");
    const ips = await fetchCFIPRanges();
    console.log(`  总计: ${ips.length} 个 IP`);

    if (ips.length < CONFIG.minTest) {
      console.error(`  ✗ IP 数量不足 (${ips.length} < ${CONFIG.minTest})，无法测速`);
      process.exit(1);
    }

    // 2. 测速
    console.log("── 2/3 测速 ──");
    results = await runSpeedTest(
      ips,
      CONFIG.testHostname,
      CONFIG.testPath,
      CONFIG.timeout,
      CONFIG.expectedStatus,
      CONFIG.concurrency
    );

    if (results.length === 0) {
      console.error("\n  ✗ 没有可用的 IP，请检查网络连接");
      process.exit(1);
    }

    // 3. 输出结果
    console.log("── 3/3 结果 ──");
    const top = printResults(results, CONFIG.topN);

    console.log("\n  📋 DNS A 记录（可直接复制）:");
    top.forEach((r, i) => {
      console.log(`     ${CONFIG.testHostname}  →  ${r.ip}  (${r.elapsed}ms)`);
    });

    if (shouldUpdateDNS) {
      if (CONFIG.dns.cloudflare.apiToken) await updateCloudflareDNS(top, CONFIG);
      if (CONFIG.dns.dnspod.secretId) await updateDNSPod(top, CONFIG);
    }
  }

  if (shouldUpdateDNS && !CONFIG.dns.cloudflare.apiToken && !CONFIG.dns.dnspod.secretId) {
    console.log("\n  💡 要启用自动 DNS 更新，请配置环境变量:");
    console.log("     Cloudflare: CF_API_TOKEN + CF_ZONE_ID + CF_RECORD_NAME");
    console.log("     DNSPod:     DNSPOD_SECRET_ID + DNSPOD_SECRET_KEY + DNSPOD_DOMAIN + DNSPOD_SUB_DOMAIN");
  }

  console.log("\n✅ 完成!\n");
}

main().catch((e) => {
  console.error("脚本异常:", e);
  process.exit(1);
});
