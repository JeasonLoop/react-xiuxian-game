# 🔌 API 文档（当前实现）

本文档区分本地 `server/index.ts`（Express + SQLite）和 Cloudflare `functions/api.ts`（Worker + KV）。接口路径同为 `/api/*`，但行为并不完全相同。

## 基础地址

- 前端常量：`constants/api.ts`；本地默认后端地址 `http://localhost:3001/api`
- Cloudflare 部署：Pages 提供前端，Worker 提供 `/api/*`；将 `VITE_API_BASE_URL` 设置为 Worker 的可访问地址（前端会追加 `/api`，已带此前缀则不重复追加）。Worker 存档使用 `RANKINGS_STORE` KV 绑定。

可通过环境变量覆盖：

```bash
VITE_API_BASE_URL=http://localhost:3001
```

## 鉴权 API（Express 与 Worker）

### `POST /api/auth/register`

注册账号。

请求体：

```json
{
  "username": "player001",
  "password": "abc12345"
}
```

说明：

- Express：用户名长度 2-32，仅允许字母/数字/下划线/中文；密码长度 6-128，需同时包含字母和数字。
- Worker：用户名至少 2 个字符、密码至少 6 个字符；账号持久化于 `RANKINGS_STORE` KV，与 Express 账号不互通。

### `POST /api/auth/login`

登录并获取 token。

响应示例：

```json
{
  "token": "<access_token>",
  "refreshToken": "<refresh_token>",
  "user": { "id": 1, "username": "player001" }
}
```
> 示例 `user.id` 为 Express/SQLite 中的数字 ID；Worker 返回字符串 UUID。两端账号存储独立，不要假设 token 或账号可跨部署通用。

### `POST /api/auth/refresh`

用 refresh token 换新 access token。

请求体：

```json
{
  "refreshToken": "<refresh_token>"
}
```

## 云存档 API（需 Bearer Token）

### `GET /api/save`

- Express/SQLite：有存档返回存档 JSON；无存档返回 `404`（`{"error":"No save found"}`）。
- Worker/KV：有存档返回存档 JSON；无存档返回 **`200`、JSON `null`**。Worker 优先从内存读取，再从 `RANKINGS_STORE` KV 恢复。

### `POST /api/save`

上传存档数据（结构参考 `SAVE_FORMAT.md`）。

请求头：

```text
Authorization: Bearer <access_token>
Content-Type: application/json
```

Express 将存档写入 SQLite；Worker 写入 `RANKINGS_STORE` KV，绑定缺失或写入失败时返回 `500`，不会确认保存成功。成功响应也不同：Express 返回 `message` 和 `rankingSynced`，Worker 返回 `{"success":true}`。

## 健康检查

### `GET /api/health`

- Express：`200`、`{"status":"ok","message":"Backend is running"}`。
- Worker：`200`、`{"status":"ok"}`；Worker 缺少 `JWT_SECRET` 时在路由检查前返回 `500`，包括健康检查。

## 前端调用实现

- `services/cloudSaveService.ts`
  - `fetchSave()`
  - `pushSave(saveData)`
- 自动处理 401：尝试刷新 token 后重试一次
- 仍失败则自动登出并提示重新登录
