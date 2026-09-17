# AGENT.md

本文件为 AI 编码代理提供本仓库的工作指南。修改代码前请先阅读，遵循现有约定，做最小改动。

## 项目概述

**cloud-spirit-cultivation（修仙文字游戏）** — 一款以修仙为主题的文字冒险游戏。玩家通过历练（AI 生成随机事件）、修炼突破、装备强化、灵宠养成、宗门任务、炼丹、抽奖等系统从炼气期修炼至飞升。

- 前端：React 19 + TypeScript 5.8 + Vite 6 + Tailwind CSS 4 + Zustand 5（状态管理）
- 后端：`server/` 独立 Express 5 服务（SQLite + JWT 认证，tsx 运行）
- 多人聊天：PartyKit（`party/`）
- 存档：localStorage / IndexedDB + 云存档（`services/cloudSaveService.ts`）

## 常用命令

```bash
npm run dev            # 同时启动前端 (vite, 端口 5175) 和后端 (server, 端口 3001)
npm run dev:frontend   # 仅前端
npm run dev:backend    # 仅后端（cd server && tsx watch index.ts）
npm run build          # 生产构建（vite build → dist/）
npm run preview        # 预览构建产物
npm run lint           # ESLint 检查 (.ts/.tsx)
npm run lint:fix       # ESLint 自动修复
npm run format         # Prettier 格式化
npx tsc --noEmit       # 类型检查（tsconfig.json 为 noEmit）

# Docker
npm run docker:build-and-up   # 构建镜像并启动
npm run docker:logs / docker:down

# 部署
npm run deploy         # 构建 + gh-pages
npm run deploy:cf      # Cloudflare 部署（scripts/deploy-cf.mjs）
npm run party:deploy   # PartyKit 部署
```

- 无自动化测试；`server/` 有自己独立的 `package.json`（依赖需在 `server/` 下单独安装）。
- Node >= 18。仓库同时存在 `package-lock.json` 与 `pnpm-lock.yaml`，日常用 npm 即可。

## 目录结构与职责

| 目录 | 职责 |
|---|---|
| `App.tsx` / `index.tsx` | 应用入口与根组件 |
| `views/` | **主要业务逻辑目录**。核心 UI（`GameView.tsx`、`ActionBar.tsx`、`GameHeader.tsx`）+ 按功能模块分文件夹（adventure、battle、sect、pet、shop、cultivation、grotto 等），每个模块为 `index.ts` + `useXxxHandlers.ts` 模式 |
| `components/` | 全局弹窗与组件（各功能 Modal、`AppContent.tsx`、`OptimizedApp.tsx`、character/common/talent 子目录） |
| `hooks/` | 全局自定义 Hook（生命周期、快捷键、自动功能、IndexedDB、Party 多人等） |
| `services/` | 服务层（AI 事件模板、战斗、商店经济、拍卖行、云存档等） |
| `store/` | Zustand store：`gameStore.ts`（玩家/日志/设置，subscribe 触发自动保存）、`uiStore.ts`（UI/弹窗/加载/冷却）、`authStore.ts`，统一由 `store/index.ts` 导出 |
| `constants/` | 所有游戏数值与配置常量，按模块分文件（realms、items、pets、sects、lottery、tribulation…），由 `constants/index.ts` 统一导出，详见 `constants/README.md` |
| `utils/` | 纯工具函数（物品生成、属性计算、存档管理、离线收益、稀有度等） |
| `types.ts` | 全部共享 TypeScript 类型定义（约 1300 行，单一文件） |
| `server/index.ts` | 后端全部逻辑（单文件 Express：用户认证 JWT、存档读写 SQLite） |
| `functions/api.ts` | Cloudflare Pages Functions 入口 |
| `scripts/` | 部署与运维脚本（Docker 构建、CF 优选 IP、部署） |

## Codegraph 代码导航

仓库根目录的 `.codegraph/codegraph.db` 是 SQLite 代码图谱索引（当前约 228 个文件、661 个函数、2900+ 调用边、1600+ 导入边）。可用于快速定位代码而无需全库 grep：

- 节点类型（`nodes` 表）：`file`、`function`、`method`、`component`、`class`、`interface`、`enum`/`enum_member`、`type_alias`、`constant`、`variable`、`import`；含 `qualified_name`、`file_path`、起止行号、签名等。
- 边类型（`edges` 表）：`calls`（调用）、`imports`（导入）、`references`（引用）、`contains`（包含）。
- `files` 表记录每个文件的 language/size/node_count；`nodes_fts` 为全文检索表。

典型查询（环境无 sqlite3 CLI，可用 Python `sqlite3` 模块）：

```bash
python -c "
import sqlite3
con = sqlite3.connect('.codegraph/codegraph.db')
# 找符号
print(con.execute(\"SELECT name, file_path, start_line FROM nodes WHERE name LIKE '%adventure%' AND kind='function'\").fetchall())
# 找某文件的被调用关系
print(con.execute(\"SELECT e.kind, n2.name, n2.file_path FROM edges e JOIN nodes n1 ON e.source=n1.id JOIN nodes n2 ON e.target=n2.id WHERE n1.name='executeAdventureCore'\").fetchall())
"
```

注意：索引是快照，新增/修改代码后其内容可能滞后，以实际文件为准。

## 架构与编码规范（必须遵循）

### Handlers 模式（views/ 的核心约定，详见 `views/README.md`）

1. **关注点分离**：`views/` 下组件只负责 UI 展示，业务逻辑封装在各模块的 `useXxxHandlers.ts` 自定义 Hook 中，通过 props 传给组件。
2. 新增功能模块：在 `views/` 下建文件夹，包含 `index.ts`（导出）+ `useXxxHandlers.ts`（接收 `player`、`setPlayer`、`addLog` 等依赖，返回该模块全部处理函数），并在 `views/index.ts` 统一导出。
3. **不要在组件内直接写业务逻辑**；不要使用已废弃的 `features/` 目录。

### 状态管理

- 使用 Zustand store（`store/gameStore.ts`、`store/uiStore.ts`），从 `store` 导入（如 `useGameStore`、`usePlayer`、`useUIStore`）。
- 全局弹窗/冷却/自动功能等 UI 状态走 `uiStore`；玩家数据变更通过 `gameStore`，自动保存由 subscribe 触发。

### 常量与类型

- 所有游戏数值/配置放入 `constants/` 对应模块文件并从 `constants` 导入；不要把数值硬编码在组件里。
- 共享类型统一定义在根目录 `types.ts`；新类型优先加在这里。
- 遵循 `constants/README.md`：文件头注释清晰、避免循环依赖、驼峰命名。

### 路径别名（vite.config.ts 与 tsconfig.json 已配置）

`@hooks` `@services` `@utils` `@constants` `@components` `@views`（以及 `@` → 根目录）。跨目录导入时优先使用别名。

### 通用约定

- 语言：代码注释、日志、UI 文案均为中文。
- 样式：Tailwind CSS 4（`tailwind.config.js` + `index.css`），图标用 lucide-react。
- 时间处理用 dayjs，不用原生 Date 做复杂运算。
- 提交前运行 `npx tsc --noEmit` 与 `npm run lint` 确保通过。
- 环境变量：前端 `VITE_*`（AI Key/Provider/Model，见 `.env.example`），后端 `JWT_SECRET`、`DATABASE_PATH`、`PORT`。不要提交任何密钥。
- 保持改动最小：不引入新依赖、不做需求之外的扩展，除非明确要求。
