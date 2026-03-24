# 🔌 API 文档（当前实现）

本文档记录当前仓库可用接口与前端调用方式。

## 基础地址

- 前端常量：`constants/api.ts`
- 默认后端地址：`http://localhost:3001`
- API 前缀：`/api`
- 最终默认：`http://localhost:3001/api`

可通过环境变量覆盖：

```bash
VITE_API_BASE_URL=http://localhost:3001
```

## 鉴权 API（`server/index.ts`）

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

- 用户名长度 2-32，仅允许字母/数字/下划线/中文
- 密码长度 6-128，要求至少含字母和数字

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

- 成功：返回存档 JSON
- 无存档：`404`

### `POST /api/save`

上传存档数据（结构参考 `SAVE_FORMAT.md`）。

请求头：

```text
Authorization: Bearer <access_token>
Content-Type: application/json
```

## 健康检查

### `GET /api/health`

响应示例：

```json
{
  "status": "ok",
  "message": "Backend is running"
}
```

## 前端调用实现

- `services/cloudSaveService.ts`
  - `fetchSave()`
  - `pushSave(saveData)`
- 自动处理 401：尝试刷新 token 后重试一次
- 仍失败则自动登出并提示重新登录
