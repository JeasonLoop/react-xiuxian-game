# 👨‍💻 开发指南（当前实现）

## 环境要求

- Node.js >= 18
- npm 或 pnpm

## 快速开始

```bash
npm install
```

前后端联调（推荐）：

```bash
npm run dev
```

说明：

- 前端：Vite（默认 `5173`）
- 后端：Express（默认 `3001`）

仅启动前端：

```bash
npm run dev:frontend
```

仅启动后端：

```bash
npm run dev:backend
```

## 关键环境变量

```bash
# 前端请求后端的基地址
VITE_API_BASE_URL=http://localhost:3001
```

> 说明：当前主流程不依赖旧版 AI 代理配置（如 `VITE_AI_USE_PROXY`）。

## 常用命令

```bash
npm run build
npm run preview
npm run lint
npm run lint:fix
npm run format
```

## 当前开发架构重点

- 状态管理：Zustand（`store/`）
- 业务处理：`views/*/useXxxHandlers.ts` + `services/*`
- 云存档：`services/cloudSaveService.ts` + `server/index.ts`
- 本地存档：`utils/saveManagerUtils.ts`

## 调试建议

- 登录/鉴权问题：先看 `server/index.ts` 的 `/api/auth/*`
- 云存档问题：检查 `constants/api.ts` 与 `VITE_API_BASE_URL`
- 存档兼容问题：检查 `ensurePlayerStatsCompatibility()`

## 调试模式说明（已重构）

- 调试模式仅在**本地开发运行**时可启用（`import.meta.env.DEV` 且本地/局域网主机）。
- 生产构建或正式部署环境会强制隐藏调试入口，并忽略本地 `DEBUG_MODE` 标记。
- 本地进入方式保持不变：标题连续点击触发；调试弹窗采用轻量化分区（快捷操作/角色调整/物品注入/危险操作）以降低卡顿。

## 文档一致性规则

- 文档与实现冲突时，以代码为准
- 新增系统请同步更新：
  - `doc/ARCHITECTURE.md`
  - `doc/API.md`
  - `doc/SAVE_FORMAT.md`
