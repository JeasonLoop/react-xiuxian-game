/**
 * Cloudflare Worker — 修仙游戏 API 后端
 * 部署: npx wrangler deploy
 */

export interface Env {
  JWT_SECRET?: string;
  LINUXDO_CLIENT_ID?: string;
  LINUXDO_CLIENT_SECRET?: string;
}

const users = new Map<string, { id: string; username: string; passwordHash: string; linuxdoId?: string }>();
const saves = new Map<string, { player: any; logs: any[]; timestamp: number }>();

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
const rankings = new Map<string, RankingEntry>();

const REALM_NAMES = ['炼气期', '筑基期', '金丹期', '元婴期', '化神期', '合道期', '长生境'];

// 从存档数据中提取排行榜字段
function extractRankingData(userId: string, username: string, saveData: any): RankingEntry {
  const p = saveData?.player || saveData || {};
  return {
    user_id: userId,
    username,
    realm_index: typeof p.realmIndex === 'number' ? p.realmIndex : 0,
    realm_level: typeof p.realmLevel === 'number' ? p.realmLevel : 1,
    exp: typeof p.exp === 'number' ? p.exp : 0,
    combat_power: typeof p.combatPower === 'number' ? p.combatPower : 0,
    spirit_stones: typeof p.spiritStones === 'number' ? p.spiritStones : 0,
    reputation: typeof p.reputation === 'number' ? p.reputation : 0,
    achievement_count: Array.isArray(p.unlockedAchievements) ? p.unlockedAchievements.length : 0,
    kill_count: typeof p.killCount === 'number' ? p.killCount : 0,
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
    const secret = env.JWT_SECRET || 'your-jwt-secret';

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
      return json(saves.get(p.id) || null);
    }

    // 上传存档
    if (path === '/save' && request.method === 'POST') {
      const auth = request.headers.get('Authorization');
      if (!auth) return json({ error: '未登录' }, 401);
      const p = await verifyToken(auth.replace('Bearer ', ''), secret);
      if (!p) return json({ error: '登录已过期' }, 401);
      const saveData = await request.json();
      saves.set(p.id, saveData);
      // 同步排行榜数据
      const user = users.get(p.id);
      const username = user?.username || p.username || '未知';
      rankings.set(p.id, extractRankingData(p.id, username, saveData));
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
      const redirectUri = url.origin + '/api/auth/linuxdo/callback';
      const clientId = env.LINUXDO_CLIENT_ID || 'YOUR_LINUXDO_CLIENT_ID';
      const authUrl = `${LINUXDO_AUTH}?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=read`;
      return Response.redirect(authUrl, 302);
    }

    // GET /api/auth/linuxdo/callback?code=xxx → 处理回调
    if (path === '/auth/linuxdo/callback' && request.method === 'GET') {
      const code = url.searchParams.get('code');
      if (!code) return json({ error: '缺少授权码' }, 400);

      try {
        const redirectUri = url.origin + '/api/auth/linuxdo/callback';
        const clientId = env.LINUXDO_CLIENT_ID || 'YOUR_LINUXDO_CLIENT_ID';
        const clientSecret = env.LINUXDO_CLIENT_SECRET || 'YOUR_LINUXDO_CLIENT_SECRET';

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

    return json({ error: 'Not Found' }, 404);
  },
};
