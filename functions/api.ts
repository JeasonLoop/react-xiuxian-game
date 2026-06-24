/**
 * Cloudflare Worker — 修仙游戏 API 后端
 * 部署: npx wrangler deploy
 */

export interface Env {
  JWT_SECRET?: string;
  LINUXDO_CLIENT_ID?: string;
  LINUXDO_CLIENT_SECRET?: string;
  RANKINGS_STORE?: KVNamespace;
}

const users = new Map<string, { id: string; username: string; passwordHash: string; linuxdoId?: string }>();
const saves = new Map<string, { player: any; logs: any[]; timestamp: number }>();

// 交易行数据：内存 + KV 持久化
interface MarketListing {
  id: number;
  seller_id: string;
  seller_name: string;
  item_name: string;
  item_type: string;
  item_description: string;
  item_rarity: string;
  price: number;
  quantity: number;
  is_equippable: boolean;
  equipment_slot?: string;
  effect_json?: string;
  item_source_json: string;
  status: 'active' | 'sold' | 'cancelled';
  created_at: number;
  sold_at?: number;
  buyer_id?: string;
}
let marketListings = new Map<number, MarketListing>();
let marketNextId = 1;
const MARKET_KV_KEY = 'market_listings';
let marketInitialized = false;

// 排行榜数据：从存档中提取的可排序字段
interface RankingEntry {
  user_id: string;
  username: string;
  realm_index: number;
  realm_level: number;
  exp: number;
  combat_power: number;
  spirit_stones: number;
  reputation: number;
  achievement_count: number;
  kill_count: number;
  play_time: number;
  updated_at: number;
}
// KV 持久化排行榜数据（跨节点共享，冷启动不丢）
const RANKINGS_KV_KEY = 'rankings_data';
const SAVE_KV_PREFIX = 'save:';

async function readRankingsFromKV(env: Env): Promise<Map<string, RankingEntry>> {
  const map = new Map<string, RankingEntry>();
  if (!env.RANKINGS_STORE) return map;
  try {
    const raw = await env.RANKINGS_STORE.get(RANKINGS_KV_KEY, 'json');
    if (raw && Array.isArray(raw)) {
      for (const entry of raw) {
        if (entry.user_id) map.set(entry.user_id, entry);
      }
    }
  } catch (e) {
    console.error('readRankingsFromKV error:', e);
  }
  return map;
}

async function writeRankingsToKV(env: Env, rankings: Map<string, RankingEntry>): Promise<void> {
  if (!env.RANKINGS_STORE) return;
  try {
    const arr = Array.from(rankings.values());
    await env.RANKINGS_STORE.put(RANKINGS_KV_KEY, JSON.stringify(arr));
  } catch (e) {
    console.error('writeRankingsToKV error:', e);
  }
}


// KV 持久化：存档
async function readSaveFromKV(env: Env, userId: string): Promise<any> {
  if (!env.RANKINGS_STORE) return null;
  try { return await env.RANKINGS_STORE.get(SAVE_KV_PREFIX + userId, 'json'); } catch { return null; }
}
async function writeSaveToKV(env: Env, userId: string, saveData: any): Promise<void> {
  if (!env.RANKINGS_STORE) return;
  try { await env.RANKINGS_STORE.put(SAVE_KV_PREFIX + userId, JSON.stringify(saveData)); } catch (e) { console.error('writeSaveToKV error:', e); }
}
async function syncUserRanking(env: Env, userId: string, username: string, saveData: any): Promise<void> {
  const rankings = await readRankingsFromKV(env);
  rankings.set(userId, extractRankingData(userId, username, saveData));
  await writeRankingsToKV(env, rankings);
}

// ── 交易行 KV 持久化 ──
async function readMarketFromKV(env: Env): Promise<Map<number, MarketListing>> {
  const map = new Map<number, MarketListing>();
  if (!env.RANKINGS_STORE) return map;
  try {
    const raw = await env.RANKINGS_STORE.get(MARKET_KV_KEY, 'json');
    if (raw && Array.isArray(raw)) {
      for (const entry of raw) {
        if (entry.id != null) map.set(entry.id, entry);
      }
    }
  } catch {}
  return map;
}
async function writeMarketToKV(env: Env): Promise<void> {
  if (!env.RANKINGS_STORE) return;
  try {
    await env.RANKINGS_STORE.put(MARKET_KV_KEY, JSON.stringify(Array.from(marketListings.values())));
  } catch {}
}
// 启动时从 KV 恢复
async function initMarketFromKV(env: Env): Promise<void> {
  const loaded = await readMarketFromKV(env);
  if (loaded.size > 0) {
    marketListings = loaded;
    marketNextId = Math.max(...Array.from(loaded.keys()), 0) + 1;
  }
}

function parseMarketSourceItem(itemSourceJson?: string): any | null {
  if (!itemSourceJson) return null;
  try {
    return JSON.parse(itemSourceJson);
  } catch {
    return null;
  }
}

const REALM_NAMES = ['炼气期', '筑基期', '金丹期', '元婴期', '化神期', '合道期', '长生境'];

// 从存档数据中提取排行榜字段（与服务端 server/index.ts 保持一致）
function extractRankingData(userId: string, username: string, saveData: any): RankingEntry {
  const p = saveData?.player || saveData || {};

  // 战斗力公式：攻击 + 防御 + 血量/10 + 神识 + 速度
  const attack = Number(p.attack) || 0;
  const defense = Number(p.defense) || 0;
  const maxHp = Number(p.maxHp) || 0;
  const spirit = Number(p.spirit) || 0;
  const speed = Number(p.speed) || 0;
  const combatPower = Math.floor(attack + defense + maxHp / 10 + spirit + speed);

  // 境界映射：支持 realm 字符串或 realmIndex 数字
  const REALM_ORDER = ['炼气期', '筑基期', '金丹期', '元婴期', '化神期', '合道期', '长生境'];
  let realmIndex = 0;
  if (typeof p.realm === 'string') {
    const idx = REALM_ORDER.indexOf(p.realm);
    realmIndex = idx >= 0 ? idx : 0;
  } else if (typeof p.realmIndex === 'number') {
    realmIndex = p.realmIndex;
  }

  return {
    user_id: userId,
    username,
    realm_index: realmIndex,
    realm_level: typeof p.realmLevel === 'number' ? p.realmLevel : 1,
    exp: typeof p.exp === 'number' ? p.exp : 0,
    combat_power: combatPower,
    spirit_stones: typeof p.spiritStones === 'number' ? p.spiritStones : 0,
    reputation: typeof p.reputation === 'number' ? p.reputation : 0,
    achievement_count: Array.isArray(p.achievements) ? p.achievements.length : (Array.isArray(p.unlockedAchievements) ? p.unlockedAchievements.length : 0),
    kill_count: typeof p.statistics?.killCount === 'number' ? p.statistics.killCount : (typeof p.killCount === 'number' ? p.killCount : 0),
    play_time: typeof p.playTime === 'number' ? p.playTime : 0,
    updated_at: Date.now(),
  };
}

// LinuxDo OAuth 配置
const LINUXDO_AUTH = 'https://connect.linux.do/oauth2/authorize';
const LINUXDO_TOKEN = 'https://connect.linux.do/oauth2/token';
const LINUXDO_USER = 'https://connect.linux.do/api/user';

async function signToken(payload: any, secret: string): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const data = { ...payload, iat: now, exp: now + 86400 * 7 };
  const encoder = new TextEncoder();
  const hb = btoa(JSON.stringify(header)).replace(/=/g, '');
  const pb = btoa(JSON.stringify(data)).replace(/=/g, '');
  const si = `${hb}.${pb}`;
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(si));
  const sb = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g, '');
  return `${hb}.${pb}.${sb}`;
}

async function verifyToken(token: string, secret: string): Promise<any> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const p = JSON.parse(atob(parts[1]));
    return p.exp < Math.floor(Date.now() / 1000) ? null : p;
  } catch { return null; }
}

async function hashPassword(pw: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pw));
  return btoa(String.fromCharCode(...new Uint8Array(hash)));
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace('/api', '');
    const secret = env.JWT_SECRET;

    // 冷启动时从 KV 恢复交易行数据
    if (!marketInitialized) {
      await initMarketFromKV(env);
      marketInitialized = true;
    }

    // 安全检查：缺少必要密钥时拒绝服务
    if (!secret) {
      return json({ error: 'Server not configured: missing JWT_SECRET' }, 500);
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type,Authorization' } });
    }

    // 注册
    if (path === '/auth/register' && request.method === 'POST') {
      const { username, password } = await request.json() as any;
      if (!username || !password || username.length < 2) return json({ error: '用户名至少2个字符' }, 400);
      if (Array.from(users.values()).some(u => u.username === username)) return json({ error: '用户名已存在' }, 409);
      const id = crypto.randomUUID();
      users.set(id, { id, username, passwordHash: await hashPassword(password) });
      const token = await signToken({ id, username }, secret);
      return json({ token, refreshToken: token, user: { id, username } });
    }

    // 登录
    if (path === '/auth/login' && request.method === 'POST') {
      const { username, password } = await request.json() as any;
      const user = Array.from(users.values()).find(u => u.username === username);
      if (!user) return json({ error: '道号不存在，请先注册', code: 'USER_NOT_FOUND' }, 404);
      if (await hashPassword(password) !== user.passwordHash) return json({ error: '密码错误，请重新输入', code: 'INVALID_PASSWORD' }, 401);
      const token = await signToken({ id: user.id, username }, secret);
      return json({ token, refreshToken: token, user: { id: user.id, username } });
    }

    // 刷新 Token
    if (path === '/auth/refresh' && request.method === 'POST') {
      const { refreshToken } = await request.json() as any;
      if (!refreshToken) return json({ error: '缺少 Token' }, 400);
      const p = await verifyToken(refreshToken, secret);
      if (!p) return json({ error: '登录已过期' }, 401);
      return json({ token: await signToken({ id: p.id, username: p.username }, secret), refreshToken: await signToken({ id: p.id, username: p.username }, secret) });
    }

    // 获取存档
    if (path === '/save' && request.method === 'GET') {
      const auth = request.headers.get('Authorization');
      if (!auth) return json({ error: '未登录' }, 401);
      const p = await verifyToken(auth.replace('Bearer ', ''), secret);
      if (!p) return json({ error: '登录已过期' }, 401);
      // 先从内存取，没有则从 KV 恢复
      let saveData = saves.get(p.id);
      if (!saveData) {
        saveData = await readSaveFromKV(env, p.id);
        if (saveData) saves.set(p.id, saveData);
      }
      // 有存档就同步排行榜（保证冷启动后排行榜不丢人）
      if (saveData) {
        const user = users.get(p.id);
        const username = user?.username || p.username || '未知';
        await syncUserRanking(env, p.id, username, saveData);
      }
      return json(saveData || null);
    }

    // 上传存档
    if (path === '/save' && request.method === 'POST') {
      const auth = request.headers.get('Authorization');
      if (!auth) return json({ error: '未登录' }, 401);
      const p = await verifyToken(auth.replace('Bearer ', ''), secret);
      if (!p) return json({ error: '登录已过期' }, 401);
      const saveData = await request.json();
      saves.set(p.id, saveData);
      // 持久化存档到 KV
      await writeSaveToKV(env, p.id, saveData);
      // 同步排行榜数据到 KV
      const user = users.get(p.id);
      const username = user?.username || p.username || '未知';
      const rankings = await readRankingsFromKV(env);
      rankings.set(p.id, extractRankingData(p.id, username, saveData));
      await writeRankingsToKV(env, rankings);
      return json({ success: true });
    }

    // 健康检查
    if (path === '/health') return json({ status: 'ok' });

    // ── 排行榜 ──

    // GET /api/leaderboard?sort=realm|combat|stones&limit=50&offset=0
    if (path === '/leaderboard' && request.method === 'GET') {
      const sort = url.searchParams.get('sort') || 'realm';
      const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '50') || 50, 1), 200);
      const offset = Math.max(parseInt(url.searchParams.get('offset') || '0') || 0, 0);

      try {
        const rankings = await readRankingsFromKV(env);
        const all = Array.from(rankings.values());
        all.sort((a, b) => {
          if (sort === 'combat') return b.combat_power - a.combat_power || b.realm_index - a.realm_index || b.realm_level - a.realm_level;
          if (sort === 'stones') return b.spirit_stones - a.spirit_stones || b.realm_index - a.realm_index || b.realm_level - a.realm_level;
          return b.realm_index - a.realm_index || b.realm_level - a.realm_level || b.exp - a.exp;
        });

        const page = all.slice(offset, offset + limit).map((row, i) => ({
          rank: offset + i + 1,
          user_id: row.user_id,
          username: row.username,
          realm: REALM_NAMES[row.realm_index] || '未知',
          realm_index: row.realm_index,
          realm_level: row.realm_level,
          exp: row.exp,
          combat_power: row.combat_power,
          spirit_stones: row.spirit_stones,
          reputation: row.reputation,
          achievement_count: row.achievement_count,
          kill_count: row.kill_count,
          play_time: row.play_time,
          updated_at: new Date(row.updated_at).toISOString(),
        }));

        return json({ sort, limit, offset, total: page.length, rankings: page });
      } catch (e: any) {
        console.error('Leaderboard error:', e.message);
        return json({ sort, limit, offset, total: 0, rankings: [] });
      }
    }

    // GET /api/leaderboard/me — 获取当前登录用户的排名
    if (path === '/leaderboard/me' && request.method === 'GET') {
      const auth = request.headers.get('Authorization');
      if (!auth) return json({ found: false, message: '未登录' });
      const p = await verifyToken(auth.replace('Bearer ', ''), secret);
      if (!p) return json({ found: false, message: '登录已过期' });

      const rankings = await readRankingsFromKV(env);
      const myRow = rankings.get(p.id);
      if (!myRow) return json({ found: false, message: '您尚未上传存档，无法查看排名' });

      try {
        const all = Array.from(rankings.values());
        const realmRank = all.filter(r =>
          r.realm_index > myRow.realm_index ||
          (r.realm_index === myRow.realm_index && r.realm_level > myRow.realm_level) ||
          (r.realm_index === myRow.realm_index && r.realm_level === myRow.realm_level && r.exp > myRow.exp)
        ).length + 1;
        const combatRank = all.filter(r => r.combat_power > myRow.combat_power).length + 1;
        const stonesRank = all.filter(r => r.spirit_stones > myRow.spirit_stones).length + 1;

        return json({
          found: true,
          username: myRow.username,
          realm_rank: realmRank,
          combat_rank: combatRank,
          stones_rank: stonesRank,
        });
      } catch (e: any) {
        console.error('Leaderboard/me error:', e.message);
        return json({ found: false, message: '暂无排名数据' });
      }
    }

    // ── LinuxDo OAuth ──

    // GET /api/auth/linuxdo → 跳转到 LinuxDo 授权页
    if (path === '/auth/linuxdo' && request.method === 'GET') {
      const clientId = env.LINUXDO_CLIENT_ID;
      if (!clientId) return json({ error: 'LinuxDo OAuth not configured' }, 500);
      const redirectUri = url.origin + '/api/auth/linuxdo/callback';
      const authUrl = `${LINUXDO_AUTH}?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=read`;
      return Response.redirect(authUrl, 302);
    }

    // GET /api/auth/linuxdo/callback?code=xxx → 处理回调
    if (path === '/auth/linuxdo/callback' && request.method === 'GET') {
      const code = url.searchParams.get('code');
      if (!code) return json({ error: '缺少授权码' }, 400);

      try {
        const redirectUri = url.origin + '/api/auth/linuxdo/callback';
        const clientId = env.LINUXDO_CLIENT_ID;
        const clientSecret = env.LINUXDO_CLIENT_SECRET;

        // 1. 用 code 换 token
        const tokenRes = await fetch(LINUXDO_TOKEN, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ grant_type: 'authorization_code', code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri }),
        });
        const tokenData = await tokenRes.json() as any;
        if (!tokenRes.ok || !tokenData.access_token) {
          return json({ error: 'OAuth 授权失败' }, 401);
        }

        // 2. 获取用户信息
        const userRes = await fetch(LINUXDO_USER, {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const linuxdoUser = await userRes.json() as any;
        if (!linuxdoUser.username) {
          return json({ error: '获取用户信息失败' }, 500);
        }

        // 3. 查找或创建用户
        const linuxdoId = String(linuxdoUser.id);
        let user = Array.from(users.values()).find(u => u.linuxdoId === linuxdoId);

        if (!user) {
          // 检查用户名冲突
          let username = linuxdoUser.username;
          if (Array.from(users.values()).some(u => u.username === username && u.linuxdoId !== linuxdoId)) {
            username = `${linuxdoUser.username}_ld`;
          }
          const id = crypto.randomUUID();
          user = { id, username, passwordHash: '', linuxdoId };
          users.set(id, user);
        }

        // 4. 签发 JWT 并重定向到前端
        const token = await signToken({ id: user.id, username: user.username }, secret);
        // 通过 postMessage 或 URL hash 传 token 给前端
        const frontendUrl = url.origin;
        const html = `<!DOCTYPE html><html><head><script>window.opener ? (window.opener.postMessage({type:'linuxdo-auth',token:'${token}',username:'${user.username}'},'*'),window.close()) : window.location.replace('${frontendUrl}?token=${token}&username=${encodeURIComponent(user.username)}')</script></head><body><p>登录成功，正在跳转...</p></body></html>`;
        return new Response(html, { headers: { 'Content-Type': 'text/html' } });
      } catch (e: any) {
        return json({ error: `OAuth 错误: ${e.message}` }, 500);
      }
    }

    // ── 交易行 API ──

    // GET /api/market/items — 分页列表
    if (path === '/market/items' && request.method === 'GET') {
      const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
      const limit = Math.min(Math.max(1, parseInt(url.searchParams.get('limit') || '10')), 100);
      const offset = (page - 1) * limit;
      const category = url.searchParams.get('category') || 'all';
      const search = (url.searchParams.get('search') || '').trim().toLowerCase();

      const all = Array.from(marketListings.values()).filter((l) => l.status === 'active');
      let filtered = all;
      if (category && category !== 'all') filtered = filtered.filter((l) => l.item_type === category);
      if (search) filtered = filtered.filter((l) => l.item_name.toLowerCase().includes(search));

      filtered.sort((a, b) => b.created_at - a.created_at);
      const total = filtered.length;
      const pageItems = filtered.slice(offset, offset + limit).map((r) => {
        const sourceItem = parseMarketSourceItem(r.item_source_json);
        return {
          id: `market-${r.id}`,
          name: r.item_name,
          type: r.item_type,
          description: r.item_description || '',
          rarity: r.item_rarity,
          price: r.price,
          quantity: r.quantity || 1,
          advancedItemType: sourceItem?.advancedItemType,
          advancedItemId: sourceItem?.advancedItemId,
          isEquippable: !!r.is_equippable,
          equipmentSlot: r.equipment_slot || undefined,
          effect: r.effect_json ? JSON.parse(r.effect_json) : undefined,
          sellerName: r.seller_name,
          sellerId: 'system',
          sellerItemData: r.item_source_json || undefined,
        };
      });

      return json({ items: pageItems, total, page, limit });
    }

    // POST /api/market/list — 上架
    if (path === '/market/list' && request.method === 'POST') {
      const auth = request.headers.get('Authorization');
      if (!auth) return json({ error: '未登录' }, 401);
      const p = await verifyToken(auth.replace('Bearer ', ''), secret);
      if (!p) return json({ error: '登录已过期' }, 401);

      const body = await request.json() as any;
      const { itemName, itemType, description, rarity, price, quantity, effect, isEquippable, equipmentSlot, itemSourceJson } = body;
      if (!itemName || !price || price <= 0) return json({ error: '参数错误' }, 400);
      const listingQuantity = Math.max(1, Math.floor(Number(quantity) || 1));

      const id = marketNextId++;
      const listing: MarketListing = {
        id, seller_id: p.id, seller_name: p.username,
        item_name: itemName, item_type: itemType || '材料', item_description: description || '',
        item_rarity: rarity || '普通', price, quantity: listingQuantity,
        is_equippable: !!isEquippable, equipment_slot: equipmentSlot || undefined,
        effect_json: effect ? JSON.stringify(effect) : undefined,
        item_source_json: itemSourceJson || '',
        status: 'active', created_at: Date.now(),
      };
      marketListings.set(id, listing);
      await writeMarketToKV(env);
      return json({ success: true, listingId: id });
    }

    // POST /api/market/purchase — 查库存
    if (path === '/market/purchase' && request.method === 'POST') {
      const auth = request.headers.get('Authorization');
      if (!auth) return json({ error: '未登录' }, 401);
      const p = await verifyToken(auth.replace('Bearer ', ''), secret);
      if (!p) return json({ error: '登录已过期' }, 401);

      const { listingId } = await request.json() as any;
      const numericId = parseInt((listingId || '').toString().replace('market-', ''));
      const listing = marketListings.get(numericId);
      if (!listing || listing.status !== 'active') return json({ error: '商品不存在或已售出' }, 404);
      if (listing.seller_id === p.id) return json({ error: '不能购买自己的商品' }, 400);

      const sourceItem = parseMarketSourceItem(listing.item_source_json);
      return json({
        success: true,
        listing: {
          id: listing.id, name: listing.item_name, type: listing.item_type,
          description: listing.item_description, rarity: listing.item_rarity,
          price: listing.price, quantity: listing.quantity || 1,
          advancedItemType: sourceItem?.advancedItemType,
          advancedItemId: sourceItem?.advancedItemId,
          isEquippable: listing.is_equippable, equipmentSlot: listing.equipment_slot,
          effect: listing.effect_json ? JSON.parse(listing.effect_json) : undefined,
          itemSourceJson: listing.item_source_json,
        },
      });
    }

    // POST /api/market/purchase/confirm — 确认购买
    if (path === '/market/purchase/confirm' && request.method === 'POST') {
      const auth = request.headers.get('Authorization');
      if (!auth) return json({ error: '未登录' }, 401);
      const p = await verifyToken(auth.replace('Bearer ', ''), secret);
      if (!p) return json({ error: '登录已过期' }, 401);

      const { listingId } = await request.json() as any;
      const numericId = parseInt((listingId || '').toString().replace('market-', ''));
      const listing = marketListings.get(numericId);
      if (!listing || listing.status !== 'active') return json({ error: '商品不存在' }, 404);
      if (listing.seller_id === p.id) return json({ error: '不能购买自己的商品' }, 400);

      listing.status = 'sold';
      listing.buyer_id = p.id;
      listing.sold_at = Date.now();
      await writeMarketToKV(env);
      return json({ success: true });
    }

    // POST /api/market/cancel — 下架
    if (path === '/market/cancel' && request.method === 'POST') {
      const auth = request.headers.get('Authorization');
      if (!auth) return json({ error: '未登录' }, 401);
      const p = await verifyToken(auth.replace('Bearer ', ''), secret);
      if (!p) return json({ error: '登录已过期' }, 401);

      const { listingId } = await request.json() as any;
      const numericId = parseInt((listingId || '').toString().replace('market-', ''));
      const listing = marketListings.get(numericId);
      if (!listing || listing.seller_id !== p.id || listing.status !== 'active') {
        return json({ error: '无权操作' }, 403);
      }

      listing.status = 'cancelled';
      await writeMarketToKV(env);
      const sourceItem = listing.item_source_json ? JSON.parse(listing.item_source_json) : null;
      return json({ success: true, item: sourceItem });
    }

    return json({ error: 'Not Found' }, 404);
  },
};
