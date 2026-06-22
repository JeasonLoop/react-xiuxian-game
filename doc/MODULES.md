# 📦 模块和目录解析（当前实现）

本文档描述当前仓库中真实存在且正在使用的模块。  
若与历史文档或旧分支说明冲突，以当前代码实现为准。

## 📁 目录结构（核心）

```text
react-xiuxian-game/
├── components/              # UI 组件（弹窗/面板/展示）
├── views/                   # 业务视图与 handlers（useXxxHandlers）
├── hooks/                   # 通用逻辑 hooks
├── store/                   # Zustand 状态层
├── services/                # 领域服务（战斗/模板事件/云存档/商店等）
├── constants/               # 配置与静态数据（多文件拆分）
├── utils/                   # 工具函数（存档、计算、toast 等）
├── server/                  # Express 后端（鉴权 + 云存档 + SQLite）
├── party/                   # PartyKit 实时通信
├── types.ts                 # 全局类型定义
├── App.tsx                  # 主应用协调器
└── doc/                     # 项目文档
```

## 🧩 核心模块

### 1) 协调层

- `App.tsx`
  - 游戏生命周期与全局流程编排
  - 串联 `views` handlers、`store` 与 `components`

### 2) 状态层（Zustand）

- `store/gameStore.ts`
  - 玩家核心数据、日志、设置
  - 本地读写档与兼容处理
- `store/uiStore.ts`
  - 弹窗、战斗 UI、自动功能状态
- `store/authStore.ts`
  - 登录态、access token、refresh token

### 3) 业务服务层（services）

- `services/battleService.ts`
  - 敌人生成、战斗结算、奖励计算、回合流程
- `services/adventureTemplateService.ts`
  - 历练事件模板与事件生成主路径
- `services/templateService.ts`
  - 名称/描述文本模板
- `services/cloudSaveService.ts`
  - 云存档请求封装（401 刷新重试）
- `services/randomService.ts`
  - 随机任务与随机事件辅助
- `services/shopService.ts`
  - 商店相关逻辑
- `services/artifactService.ts`
  - 法宝相关逻辑

### 4) 视图与交互层（views + components）

- `views/*/useXxxHandlers.ts`
  - 各系统交互逻辑入口（历练、打坐、突破、宗门、灵宠等）
- `views/GameView.tsx`
  - 游戏主视图聚合
- `views/ModalsContainer.tsx`
  - 各功能弹窗统一挂载
- `components/*.tsx`
  - 展示层与交互组件（如战斗、背包、成就、秘境、宗门）

### 5) 基础设施层

- `server/index.ts`
  - `/api/auth/register`
  - `/api/auth/login`
  - `/api/auth/refresh`
  - `/api/save`（GET/POST）
  - `/api/health`
- `constants/api.ts`
  - 前端后端地址拼接与 API 基地址
- `utils/saveManagerUtils.ts`
  - 本地导入导出、对比、校验

## 🔄 核心数据流

### 游戏行为流

`用户操作 -> views handlers -> services/utils -> Zustand 更新 -> UI 重渲染`

### 存档流

- 本地：`gameStore -> saveManagerUtils -> localStorage`
- 云端：`cloudSaveService -> /api/save -> SQLite`

### 鉴权流

`login -> token/refreshToken -> 401 refresh -> 重试请求`

## 🎮 当前已实现功能域（概览）

- 角色成长（境界、属性、突破）
- 历练与随机事件
- 战斗（即时结算 + 回合制并存）
- 功法、装备、背包、商店、炼丹
- 灵宠系统、宗门系统、秘境系统
- 成就与称号系统
- 自动功能（自动打坐/自动历练）
- 本地单存档 + 登录后云存档
- PartyKit 实时在线能力（在线人数/消息）

## ⚠️ 文档边界与历史说明

- 旧文档中关于 `config/aiConfig.ts`、`services/aiService.ts`、`api/proxy` 的说明不再是当前主实现路径。
- 常量已拆分在 `constants/*.ts`，不再使用单一大文件 `constants.ts` 作为主入口。
- 若新增模块，请同步更新：
  - `doc/ARCHITECTURE.md`
  - `doc/API.md`
  - `doc/SAVE_FORMAT.md`
  - `doc/MODULES.md`
