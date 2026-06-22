/**
 * Cloudflare 一键部署脚本
 * 用法: node scripts/deploy-cf.mjs
 * 将前端部署到 Cloudflare Pages，后端部署到 Cloudflare Workers
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

// ── 加载环境变量 ──
const loadEnv = (path) => {
  if (!existsSync(path)) return;
  const content = readFileSync(path, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
};

loadEnv(".env");
loadEnv(".env.production", { override: true });

// ── 配置 ──
const PAGES_PROJECT = process.env.CF_PAGES_PROJECT || "xiuxian-game";
const WORKER_NAME = "xiuxian-game-api";
const API_DOMAIN = process.env.CF_API_DOMAIN || "xiuxian-api.jeasonloop.online";
const API_URL = `https://${API_DOMAIN}`;

// ── 工具函数 ──
const run = (cmd, args, opts = {}) => {
  console.log(`\n→ ${cmd} ${args.join(" ")}`);
  const result = spawnSync(cmd, args, { stdio: "inherit", shell: true, env: { ...process.env, ...opts.env }, ...opts });
  if (result.status !== 0) {
    console.error(`✗ 命令失败: ${cmd} ${args.join(" ")}`);
    process.exit(result.status ?? 1);
  }
  return result;
};

// ── 主流程 ──
console.log("╔══════════════════════════════════════╗");
console.log("║   ⛩️  云灵修仙 — Cloudflare 部署     ║");
console.log("╚══════════════════════════════════════╝");
console.log(`   前端: xiuxian.jeasonloop.online`);
console.log(`   API:  ${API_DOMAIN}`);
console.log("");

// 1. 安装依赖
console.log("── 1/5 安装依赖 ──");
run("npm", ["install"]);

// 2. 构建前端（注入 API 地址）
console.log("── 2/5 构建前端 ──");
run("npm", ["run", "build"], { env: { VITE_API_BASE_URL: API_URL } });

// 3. 部署前端到 Cloudflare Pages
console.log("── 3/5 部署前端 (Pages) ──");
try {
  run("npx", ["wrangler", "pages", "deploy", "dist", "--project-name", PAGES_PROJECT, "--commit-dirty=true"]);
} catch {
  // 项目不存在则先创建
  console.log("  → Pages 项目不存在，先创建...");
  run("npx", ["wrangler", "pages", "project", "create", PAGES_PROJECT, "--production-branch=main"]);
  run("npx", ["wrangler", "pages", "deploy", "dist", "--project-name", PAGES_PROJECT, "--commit-dirty=true"]);
}

// 4. 部署后端到 Cloudflare Workers
console.log("── 4/5 部署后端 (Worker) ──");
run("npx", ["wrangler", "deploy"]);

// 5. 完成
console.log("");
console.log("── 5/5 部署完成 ──");
console.log("");
console.log("  前端:  https://xiuxian.jeasonloop.online");
console.log(`  API:   ${API_URL}/api`);
console.log(`  健康:  ${API_URL}/api/health`);
console.log("");
console.log("  ⚠  Cloudflare Dashboard 还需操作:");
console.log("  1. Pages → xiuxian-game → Custom Domains → 添加 xiuxian.jeasonloop.online");
console.log(`  2. Workers → ${WORKER_NAME} → Settings → Domains → 添加 ${API_DOMAIN}`);
console.log("  3. npx wrangler secret put JWT_SECRET  (设随机密钥)");
console.log("");
