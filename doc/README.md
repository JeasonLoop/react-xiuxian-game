# 📚 修仙文字游戏 - 文档索引

本文档索引按当前仓库实现维护。

## 文档导航

- [开发指南](./DEVELOPMENT.md)
- [架构设计](./ARCHITECTURE.md)
- [模块解析](./MODULES.md)
- [API 文档](./API.md)
- [存档格式](./SAVE_FORMAT.md)
- [可执行改进方案](./IMPROVEMENTS.md)
- [贡献指南](./CONTRIBUTING.md)
- [版本更新日志](../public/CHANGELOG.md)

## 当前技术基线（以代码为准）

- 前端：React 19 + TypeScript + Vite
- 状态管理：Zustand（`store/gameStore.ts`、`store/uiStore.ts`）
- 后端：Express + SQLite + JWT（`server/index.ts`）
- 存档：
  - 本地单存档（`STORAGE_KEYS.SAVE`）
  - 登录后可使用云存档（`/api/save`）
- 战斗：即时结算 + 回合制并存
- 事件系统：本地模板库驱动（`adventureTemplateService` / `templateService`）

## 目录结构（当前仓库）

```text
react-xiuxian-game/
├── components/
├── constants/
├── hooks/
├── services/
├── store/
├── utils/
├── views/
├── server/                # Express 后端（鉴权 + 云存档）
├── party/                 # PartyKit 实时通信
└── doc/
```

## 说明

- 当前仓库没有 `doc/GAMEPLAY.md`。
- 旧文档里提到的 `config/aiConfig.ts`、`services/aiService.ts`、`api/proxy` 已不属于当前主实现路径。
- 如文档与代码冲突，统一以代码实现为准。
