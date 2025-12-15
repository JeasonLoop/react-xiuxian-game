# 👨‍💻 开发指南

本文档提供从快速开始到深入开发的完整指南，包括环境搭建、调试技巧、构建部署和最佳实践。

## 📋 目录

- [快速开始](#快速开始)
- [开发环境搭建](#开发环境搭建)
- [开发工作流](#开发工作流)
- [调试技巧](#调试技巧)
- [构建和部署](#构建和部署)
- [代码规范](#代码规范)
- [测试](#测试)
- [常见问题排查](#常见问题排查)

---

## 🚀 快速开始

### 前置要求

- **Node.js** >= 18.0.0
- **包管理器**:
  - **pnpm** >= 8.0.0 (推荐)
  - 或 **npm** >= 9.0.0
  - 或 **yarn** >= 1.22.0

### 检查环境

```bash
# 检查 Node.js 版本
node --version

# 检查包管理器版本
pnpm --version  # 或 npm --version
```

### 安装步骤

#### 1. 克隆项目

```bash
git clone <repository-url>
cd react-xiuxian-game
```

#### 2. 安装依赖

**使用 pnpm (推荐):**

```bash
pnpm install
```

**或使用 npm:**

```bash
npm install
```

**或使用 yarn:**

```bash
yarn install
```

#### 3. 配置环境变量（必需）

**⚠️ 重要**: 项目不再包含硬编码的 API Key，必须配置环境变量。

创建 `.env.local` 文件（此文件不会被提交到 Git）：

```bash
# .env.local
# AI 提供商选择: 'glm' | 'siliconflow' | 'openai' | 'custom'
VITE_AI_PROVIDER=glm
VITE_AI_KEY=your-api-key-here
VITE_AI_MODEL=glm-4.5-air
VITE_AI_API_URL=https://open.bigmodel.cn/api/paas/v4/chat/completions
# 是否使用代理（开发环境默认 true，生产环境默认 false）
VITE_AI_USE_PROXY=true
```

**配置步骤**:

1. 在项目根目录创建 `.env.local` 文件
2. 复制上面的内容到文件中
3. 将 `your-api-key-here` 替换为你的实际 API Key

> 💡 **获取 API Key**:
>
> - **GLM (智谱)**: 访问 [智谱AI](https://open.bigmodel.cn) 注册账号并创建 API Key
> - **SiliconFlow**: 访问 [SiliconFlow](https://siliconflow.cn) 注册账号并创建 API Key
> - **OpenAI**: 访问 [OpenAI](https://platform.openai.com) 注册账号并创建 API Key
>
> ⚠️ **安全提示**:
>
> - `.env.local` 文件已添加到 `.gitignore`，不会被提交到 Git
> - 不要将 API Key 提交到代码仓库
> - 如果 API Key 泄露，请立即在服务商处重新生成
> - 生产环境必须使用代理模式（`VITE_AI_USE_PROXY=true`）

#### 4. 启动开发服务器

```bash
# 使用 pnpm
pnpm dev

# 或使用 npm
npm run dev

# 或使用 yarn
yarn dev
```

#### 5. 访问应用

打开浏览器访问: `http://localhost:5173` (Vite 默认端口)

### 🎮 开始游戏

1. 在启动界面输入你的修仙者名称
2. 系统会随机分配一个天赋（不可更改）
3. 点击"开始游戏"按钮
4. 开始你的修仙之旅！

### 🔍 验证安装

安装成功后，你应该能够：

1. ✅ 启动开发服务器无错误
2. ✅ 在浏览器中看到游戏界面
3. ✅ 能够创建新游戏
4. ✅ 能够进行历练操作（如果配置了 API Key）

---

## 🛠️ 开发环境搭建

### 配置开发工具

#### VS Code 推荐插件

- **ESLint** - 代码检查
- **Prettier** - 代码格式化
- **TypeScript** - TypeScript 支持
- **React Snippets** - React 代码片段

#### VS Code 设置

创建 `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

---

## 🚀 开发工作流

### 启动开发服务器

```bash
pnpm dev
```

访问 `http://localhost:5173`

### 热重载

Vite 支持热模块替换（HMR），修改代码后自动刷新。

### 代码检查

```bash
# TypeScript 类型检查
npx tsc --noEmit

# ESLint 检查（如果配置了）
npx eslint .
```

### 常用命令

#### 开发

```bash
# 启动开发服务器
pnpm dev

# 启动开发服务器（指定端口）
pnpm dev -- --port 3000
```

#### 构建

```bash
# 构建生产版本
pnpm build

# 预览生产构建
pnpm preview
```

#### 部署

```bash
# 部署到 GitHub Pages
pnpm deploy

# 构建用于 Vercel 部署
pnpm vercel-build
```

---

## 🐛 调试技巧

### 1. 浏览器调试

#### React DevTools

安装 [React DevTools](https://react.dev/learn/react-developer-tools) 浏览器扩展：

- 查看组件树
- 检查组件 props 和 state
- 性能分析

#### 控制台调试

```typescript
// 在代码中添加 console.log
console.log('Player state:', player);
console.log('Adventure result:', result);

// 使用 debugger 断点
debugger; // 浏览器会在此处暂停
```

### 2. 状态调试

#### 查看 localStorage

```javascript
// 浏览器控制台
localStorage.getItem('xiuxian-game-save');
localStorage.getItem('xiuxian-game-settings');
```

#### 修改存档

```javascript
// 在控制台中修改存档
const save = JSON.parse(localStorage.getItem('xiuxian-game-save'));
save.player.spiritStones = 999999;
localStorage.setItem('xiuxian-game-save', JSON.stringify(save));
// 刷新页面
```

### 3. 网络调试

#### 查看 API 请求

1. 打开开发者工具（F12）
2. 切换到 Network 标签
3. 筛选 XHR/Fetch
4. 查看请求详情

#### Mock API 响应

```typescript
// 在开发环境中模拟 API 响应
if (import.meta.env.DEV) {
  // 返回模拟数据
  return mockAdventureResult;
}
```

### 4. 性能调试

#### React Profiler

使用 React DevTools 的 Profiler：

1. 打开 React DevTools
2. 切换到 Profiler 标签
3. 点击录制按钮
4. 执行操作
5. 停止录制，查看性能分析

#### 性能监控

```typescript
// 测量函数执行时间
const start = performance.now();
await generateAdventureEvent(player);
const end = performance.now();
console.log(`API call took ${end - start}ms`);
```

---

## 🏗️ 构建和部署

### 构建生产版本

```bash
pnpm build
```

构建产物在 `dist/` 目录。

### 预览构建

```bash
pnpm preview
```

### 部署到 Vercel

#### 方法一：通过 Dashboard

1. 访问 [vercel.com](https://vercel.com)
2. 导入 GitHub 仓库
3. 配置构建命令: `pnpm build`
4. 配置输出目录: `dist`
5. 配置环境变量（`VITE_AI_KEY` 等）
6. 点击部署

#### 方法二：通过 CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel

# 部署到生产环境
vercel --prod
```

### 部署到 GitHub Pages

```bash
pnpm deploy
```

需要配置 `package.json`:

```json
{
  "scripts": {
    "deploy": "npm run build && npx gh-pages -d dist"
  }
}
```

---

## 📝 代码规范

### TypeScript 规范

#### 类型定义

```typescript
// ✅ 好的做法：明确的类型
interface PlayerStats {
  name: string;
  hp: number;
}

// ❌ 不好的做法：使用 any
const player: any = { ... };
```

#### 函数签名

```typescript
// ✅ 好的做法：明确的参数和返回类型
function handleAdventure(player: PlayerStats): Promise<AdventureResult> {
  // ...
}

// ❌ 不好的做法：缺少类型
function handleAdventure(player) {
  // ...
}
```

### React 规范

#### 组件定义

```typescript
// ✅ 好的做法：函数组件
export default function StatsPanel({ player }: Props) {
  return <div>...</div>;
}

// ✅ 好的做法：使用 React.memo 优化
export default React.memo(StatsPanel);
```

#### Hooks 使用

```typescript
// ✅ 好的做法：正确的依赖数组
useEffect(() => {
  // ...
}, [player, logs]);

// ❌ 不好的做法：缺少依赖
useEffect(() => {
  // ...
}, []); // 缺少 player 依赖
```

### 命名规范

- **组件**: PascalCase (`StatsPanel.tsx`)
- **函数**: camelCase (`handleAdventure`)
- **常量**: UPPER_SNAKE_CASE (`REALM_DATA`)
- **类型/接口**: PascalCase (`PlayerStats`)
- **文件**: 与导出名称一致

### 代码组织

```typescript
// 1. 导入顺序
// React
import React, { useState } from 'react';
// 第三方库
import { Sword } from 'lucide-react';
// 类型
import { PlayerStats } from '../types';
// 常量
import { REALM_DATA } from '../constants';
// 服务
import { generateAdventureEvent } from '../services/aiService';
// 组件
import StatsPanel from './StatsPanel';

// 2. 组件结构
export default function Component() {
  // 1. Hooks
  const [state, setState] = useState();

  // 2. 计算值
  const computed = useMemo(() => {...}, [deps]);

  // 3. 事件处理
  const handleClick = useCallback(() => {...}, [deps]);

  // 4. 副作用
  useEffect(() => {...}, [deps]);

  // 5. 渲染
  return <div>...</div>;
}
```

---

## 🧪 测试

### 单元测试（可选）

```typescript
// services/battleService.test.ts
import { calcDamage } from './battleService';

describe('calcDamage', () => {
  it('should calculate damage correctly', () => {
    const damage = calcDamage(100, 50);
    expect(damage).toBeGreaterThan(0);
  });
});
```

### 手动测试清单

- [ ] 创建新游戏
- [ ] 进行历练
- [ ] 打坐修炼
- [ ] 突破境界
- [ ] 装备物品
- [ ] 使用物品
- [ ] 炼丹
- [ ] 加入宗门
- [ ] 完成宗门任务
- [ ] 抽奖
- [ ] 培养灵宠
- [ ] 查看成就
- [ ] 存档和读档

---

## 🔧 常见问题排查

### 1. 端口被占用

如果默认端口 5173 被占用，Vite 会自动尝试下一个可用端口，或手动指定：

```bash
pnpm dev -- --port 3000
```

### 2. API 请求失败

如果历练时出现 API 错误：

- 检查 API Key 是否有效
- 检查网络连接
- 查看浏览器控制台的错误信息
- 如果使用代理，检查代理配置
- 检查 Vercel Function 日志（生产环境）

### 3. 依赖安装失败

```bash
# 清除缓存后重新安装
rm -rf node_modules package-lock.json pnpm-lock.yaml
pnpm install
```

### 4. TypeScript 类型错误

```bash
# 检查 TypeScript 版本
npx tsc --version

# 清除 TypeScript 缓存
rm -rf node_modules/.cache
npx tsc --noEmit

# 重新安装类型定义
pnpm install --save-dev @types/node
```

### 5. 构建失败

```bash
# 检查 Node.js 版本
node --version  # 需要 >= 18.0.0

# 检查构建日志
pnpm build --debug
```

### 6. 热重载不工作

```bash
# 重启开发服务器
# 清除浏览器缓存
# 检查文件是否被正确保存
```

---

## 📦 依赖管理

### 添加新依赖

```bash
# 生产依赖
pnpm add package-name

# 开发依赖
pnpm add -D package-name
```

### 更新依赖

```bash
# 检查过时的包
pnpm outdated

# 更新所有依赖
pnpm update

# 更新特定包
pnpm update package-name
```

### 移除依赖

```bash
pnpm remove package-name
```

---

## 🎨 UI 开发

### 添加新组件

#### 1. 创建纯 UI 组件（components/）

1. 在 `components/` 目录创建文件
2. 定义组件和 Props 接口
3. 实现组件逻辑（纯展示，无业务逻辑）

#### 2. 创建视图模块（views/）

1. 在 `views/` 目录创建功能模块文件夹
2. 创建 `useXxxHandlers.ts` 文件，实现业务逻辑 Handlers
3. 创建 `index.ts` 文件，导出 Handlers
4. 在 `views/GameView.tsx` 中使用 Handlers
5. 在 `views/ModalsContainer.tsx` 中添加模态框（如需要）

#### 3. 添加可复用功能（features/）

如果功能需要跨模块复用：

1. 在 `features/` 目录创建功能模块
2. 实现功能 Hook
3. 在 `features/index.ts` 中导出
4. 在需要的 Handlers 中使用

### 样式规范

- 使用 Tailwind CSS（如果配置了）
- 或使用内联样式
- 保持样式一致性

### 响应式设计

```typescript
// 使用媒体查询或条件渲染
const isMobile = window.innerWidth < 768;

{isMobile ? (
  <MobileSidebar />
) : (
  <DesktopSidebar />
)}
```

---

## 🔄 Git 工作流

### 提交规范

```bash
# 功能开发
git checkout -b feature/new-feature
git commit -m "feat: 添加新功能"

# Bug 修复
git checkout -b fix/bug-description
git commit -m "fix: 修复某个bug"

# 文档更新
git commit -m "docs: 更新文档"
```

### 提交信息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

**类型**:

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式
- `refactor`: 重构
- `test`: 测试
- `chore`: 构建/工具

---

## 📚 相关文档

- [游戏玩法说明](./GAMEPLAY.md) - 了解游戏机制
- [架构设计](./ARCHITECTURE.md) - 了解项目结构
- [模块解析](./MODULES.md) - 了解代码模块
- [API 文档](./API.md) - API 使用说明

---

## 🆘 获取帮助

如果遇到问题：

1. 查看本文档的"常见问题排查"部分
2. 查看相关文档
3. 在 GitHub 上提交 Issue

---

**提示**: 建议使用 pnpm 作为包管理器，它比 npm 更快且更节省磁盘空间。建议定期更新依赖，保持项目健康。
