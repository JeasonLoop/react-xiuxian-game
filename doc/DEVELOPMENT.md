# 👨‍💻 开发指南

本文档提供详细的开发环境搭建、调试技巧、构建部署和最佳实践。

## 🛠️ 开发环境搭建

### 1. 安装依赖

```bash
# 使用 pnpm (推荐)
pnpm install

# 或使用 npm
npm install
```

### 2. 配置开发工具

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

### 3. 环境变量配置

创建 `.env.local` 文件（可选）:

```bash
VITE_AI_KEY=your-api-key-here
VITE_AI_MODEL=Qwen/Qwen2.5-72B-Instruct
VITE_AI_API_URL=https://api.siliconflow.cn/v1/chat/completions
```

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
5. 点击部署

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

## 🔧 常见问题排查

### 1. 类型错误

```bash
# 清除 TypeScript 缓存
rm -rf node_modules/.cache
npx tsc --noEmit
```

### 2. 依赖问题

```bash
# 清除并重新安装
rm -rf node_modules package-lock.json pnpm-lock.yaml
pnpm install
```

### 3. 构建失败

```bash
# 检查 Node.js 版本
node --version  # 需要 >= 18.0.0

# 检查构建日志
pnpm build --debug
```

### 4. API 请求失败

- 检查 API Key 是否有效
- 检查网络连接
- 查看浏览器控制台错误
- 检查 Vercel Function 日志

### 5. 热重载不工作

```bash
# 重启开发服务器
# 清除浏览器缓存
# 检查文件是否被正确保存
```

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

## 📚 相关文档

- [快速开始](./QUICK_START.md) - 安装和运行
- [架构设计](./ARCHITECTURE.md) - 架构说明
- [模块解析](./MODULES.md) - 模块说明
- [API 文档](./API.md) - API 使用

## 🆘 获取帮助

- 查看本文档的"常见问题排查"部分
- 在 GitHub 上提交 Issue
- 查看相关文档

---

**提示**: 建议定期更新依赖，保持项目健康。
