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
      saves.set(p.id, await request.json());
      return json({ success: true });
    }

    // 健康检查
    if (path === '/health') return json({ status: 'ok' });

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
