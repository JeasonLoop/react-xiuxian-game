# 🏗️ 架构设计文档

本文档描述当前仓库的真实架构，所有内容以代码实现为准。

## 总体架构

```text
Browser (React + Zustand)
  ├─ UI/Views/Handlers
  ├─ 本地存档（单存档）
  ├─ 模板事件与战斗逻辑（services）
  └─ 登录态（token/refreshToken）
        │
        ▼ HTTP
Express Server (server/index.ts)
  ├─ /api/auth/register
  ├─ /api/auth/login
  ├─ /api/auth/refresh
  ├─ /api/save (GET/POST, JWT)
  └─ SQLite (users, saves)
```

## 分层与职责

### 1) 视图与交互层

- `components/`: 通用 UI 组件
- `views/`: 模块化业务视图与处理器（`useXxxHandlers`）
- `App.tsx`: 游戏生命周期编排与模块集成

### 2) 状态层

- `store/gameStore.ts`: 玩家数据、日志、设置、存读档
- `store/uiStore.ts`: 弹窗、战斗 UI、自动功能、冷却
- `store/authStore.ts`: 登录态、token、刷新 token

### 3) 业务逻辑层

- `services/battleService.ts`: 战斗判定、敌人生成、奖励计算、回合制逻辑
- `services/adventureTemplateService.ts`: 历练事件模板库与事件生成
- `services/templateService.ts`: 名称/描述模板
- `services/cloudSaveService.ts`: 云存档请求封装

### 4) 基础设施层

- `server/index.ts`: Express API、JWT 鉴权、SQLite 存储
- `utils/saveManagerUtils.ts`: 存档工具
- `constants/api.ts`: 前端后端地址拼接（`VITE_API_BASE_URL`）

## 数据流

### 游戏行为流

`用户操作 -> views handlers -> services/utils -> Zustand 更新 -> UI 重渲染`

### 存档流

- 本地：`gameStore -> saveManagerUtils -> localStorage`
- 云端：`cloudSaveService -> /api/save -> SQLite`

### 鉴权流

`/api/auth/login -> access token + refresh token -> 401 时 refresh 重试`

## 当前关键特性

- 单存档本地保存与加载
- 云存档（需登录）
- 自动功能（自动打坐/自动历练）
- 回合制战斗与旧战斗结算并存
- PartyKit 实时连接（在线人数与消息）

## 说明

- 旧版“Vercel `/api/proxy` 转发 AI”的说明不再代表当前主实现。
- 事件生成目前主要使用本地模板，不依赖实时 AI 接口作为主路径。
