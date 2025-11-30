# 🚀 快速开始指南

本指南将帮助你快速搭建开发环境并运行项目。

## 📋 前置要求

### 必需环境

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

## 🔧 安装步骤

### 1. 克隆项目

```bash
git clone <repository-url>
cd react-xiuxian-game
```

### 2. 安装依赖

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

### 3. 配置环境变量（必需）

**⚠️ 重要**: 项目不再包含硬编码的 API Key，必须配置环境变量。

创建 `.env.local` 文件（此文件不会被提交到 Git）：

```bash
# .env.local
VITE_AI_KEY=your-api-key-here
VITE_AI_MODEL=Qwen/Qwen2.5-72B-Instruct
VITE_AI_API_URL=https://api.siliconflow.cn/v1/chat/completions
```

**配置步骤**:

1. 在项目根目录创建 `.env.local` 文件
2. 复制上面的内容到文件中
3. 将 `your-api-key-here` 替换为你的实际 API Key

> 💡 **获取 API Key**:
>
> - 访问 [SiliconFlow](https://siliconflow.cn) 注册账号
> - 创建 API Key
> - 或使用其他兼容 OpenAI API 格式的服务
>
> ⚠️ **安全提示**:
>
> - `.env.local` 文件已添加到 `.gitignore`，不会被提交到 Git
> - 不要将 API Key 提交到代码仓库
> - 如果 API Key 泄露，请立即在服务商处重新生成

### 4. 启动开发服务器

```bash
# 使用 pnpm
pnpm dev

# 或使用 npm
npm run dev

# 或使用 yarn
yarn dev
```

### 5. 访问应用

打开浏览器访问: `http://localhost:5173` (Vite 默认端口)

## 🎮 开始游戏

1. 在启动界面输入你的修仙者名称
2. 系统会随机分配一个天赋（不可更改）
3. 点击"开始游戏"按钮
4. 开始你的修仙之旅！

## 📦 项目结构

```
react-xiuxian-game/
├── components/          # React 组件
├── services/           # 服务层（AI、战斗等）
├── doc/                # 项目文档
├── api/                # API 代理（Vercel Functions）
├── App.tsx             # 主应用组件
├── types.ts            # TypeScript 类型定义
├── constants.ts        # 游戏常量配置
├── vite.config.ts      # Vite 配置
└── package.json        # 项目配置
```

## 🛠️ 常用命令

### 开发

```bash
# 启动开发服务器
pnpm dev

# 启动开发服务器（指定端口）
pnpm dev -- --port 3000
```

### 构建

```bash
# 构建生产版本
pnpm build

# 预览生产构建
pnpm preview
```

### 部署

```bash
# 部署到 GitHub Pages
pnpm deploy

# 构建用于 Vercel 部署
pnpm vercel-build
```

## 🔍 验证安装

安装成功后，你应该能够：

1. ✅ 启动开发服务器无错误
2. ✅ 在浏览器中看到游戏界面
3. ✅ 能够创建新游戏
4. ✅ 能够进行历练操作（如果配置了 API Key）

## ⚠️ 常见问题

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

# 重新安装类型定义
pnpm install --save-dev @types/node
```

## 📚 下一步

- 阅读 [游戏玩法说明](./GAMEPLAY.md) 了解游戏机制
- 查看 [架构设计](./ARCHITECTURE.md) 了解项目结构
- 阅读 [开发指南](./DEVELOPMENT.md) 开始开发

## 🆘 获取帮助

如果遇到问题：

1. 查看本文档的"常见问题"部分
2. 查看 [开发指南](./DEVELOPMENT.md) 的故障排查部分
3. 在 GitHub 上提交 Issue

---

**提示**: 建议使用 pnpm 作为包管理器，它比 npm 更快且更节省磁盘空间。
