/**
 * Cloudflare Worker — 修仙游戏 API 后端
 * 部署: npx wrangler deploy
 */

export interface Env {
  JWT_SECRET?: string;
}

const users = new Map<string, { id: string; username: string; passwordHash: string }>();
const saves = new Map<string, { player: any; logs: any[]; timestamp: number }>();

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
      if (!user || await hashPassword(password) !== user.passwordHash) return json({ error: '用户名或密码错误' }, 401);
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
      saves.set(p.id, await request.json());
      return json({ success: true });
    }

    // 健康检查
    if (path === '/health') return json({ status: 'ok' });

    return json({ error: 'Not Found' }, 404);
  },
};
