import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import api, { type Env } from '../functions/api';

Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });

async function main() {
  const data = new Map<string, string>();
  let failSave = false;
  const env: Env = {
    JWT_SECRET: 'local-regression-secret',
    RANKINGS_STORE: {
      async get(key: string, type?: string) {
        const value = data.get(key);
        return type === 'json' && value ? JSON.parse(value) : value ?? null;
      },
      async put(key: string, value: string) {
        if (failSave && key.startsWith('save:')) throw new Error('KV unavailable');
        data.set(key, value);
      },
    },
  };
  const post = (path: string, body: unknown, token?: string) => api.fetch(new Request(`https://example.com/api${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  }), env);

  const register = await post('/auth/register', { username: '修仙者', password: 'abc12345' });
  assert.equal(register.status, 200);
  const account = await register.json() as { token: string; refreshToken: string; user: { id: string } };
  assert.notEqual(account.token, account.refreshToken);
  assert.equal((await post('/auth/refresh', { refreshToken: account.token })).status, 401);
  assert.equal((await post('/save', { player: { name: 'x' } }, account.refreshToken)).status, 401);
  // 账号不依赖进程内 users Map，同一 KV 可供后续请求重新查询。
  const coldLogin = await api.fetch(new Request('https://example.com/api/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: '修仙者', password: 'abc12345' }),
  }), env);
  assert.equal(coldLogin.status, 200);
  assert.equal(((await coldLogin.json()) as { user: { id: string } }).user.id, account.user.id);

  const login = await post('/auth/login', { username: '修仙者', password: 'abc12345' });
  assert.equal(login.status, 200);
  assert.equal(((await login.json()) as { user: { id: string } }).user.id, account.user.id);
  const refreshed = await post('/auth/refresh', { refreshToken: account.refreshToken });
  assert.equal(refreshed.status, 200);
  const tokens = await refreshed.json() as { token: string; refreshToken: string };
  assert.notEqual(tokens.token, tokens.refreshToken);

  failSave = true;
  const failed = await post('/save', { player: { name: 'fail' } }, tokens.token);
  assert.equal(failed.status, 500);
  const afterFailure = await api.fetch(new Request('https://example.com/api/save', {
    headers: { Authorization: `Bearer ${tokens.token}` },
  }), env);
  assert.equal(await afterFailure.json(), null);
  failSave = false;
  const saved = await post('/save', { player: { name: 'success' } }, tokens.token);
  assert.equal(saved.status, 200);
  assert.equal(JSON.parse(data.get(`save:${account.user.id}`)!).player.name, 'success');
  console.log('Worker auth/save regression passed');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
