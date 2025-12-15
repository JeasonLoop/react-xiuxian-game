# 🤝 贡献指南

感谢你对修仙文字游戏项目的关注！我们欢迎任何形式的贡献。

## 📋 贡献方式

### 1. 报告 Bug

如果发现 Bug，请：

1. 检查 [Issues](https://github.com/your-repo/issues) 是否已有相同问题
2. 如果没有，创建新 Issue
3. 提供详细信息：
   - Bug 描述
   - 复现步骤
   - 预期行为
   - 实际行为
   - 环境信息（浏览器、操作系统等）
   - 截图（如果适用）

### 2. 提出功能建议

如果有好的想法：

1. 检查是否已有类似建议
2. 创建 Feature Request Issue
3. 详细描述：
   - 功能描述
   - 使用场景
   - 预期效果
   - 可能的实现方式（可选）

### 3. 提交代码

#### Fork 和克隆

```bash
# Fork 项目到你的 GitHub 账号
# 然后克隆你的 Fork
git clone https://github.com/your-username/react-xiuxian-game.git
cd react-xiuxian-game
```

#### 创建分支

```bash
# 从 main 分支创建新分支
git checkout -b feature/your-feature-name

# 或修复 Bug
git checkout -b fix/bug-description
```

#### 开发

1. 安装依赖: `pnpm install`
2. 启动开发服务器: `pnpm dev`
3. 进行开发和测试
4. 确保代码通过类型检查: `npx tsc --noEmit`

#### 提交代码

```bash
# 添加更改
git add .

# 提交（使用清晰的提交信息）
git commit -m "feat: 添加新功能描述"

# 推送到你的 Fork
git push origin feature/your-feature-name
```

#### 创建 Pull Request

1. 在 GitHub 上创建 Pull Request
2. 填写 PR 描述：
   - 更改内容
   - 为什么需要这个更改
   - 如何测试
   - 相关 Issue（如果有）

## 📝 代码规范

### TypeScript

- 使用明确的类型，避免 `any`
- 函数参数和返回值都要有类型
- 使用接口定义对象结构

```typescript
// ✅ 好的做法
interface PlayerStats {
  name: string;
  hp: number;
}

function handleAdventure(player: PlayerStats): Promise<AdventureResult> {
  // ...
}

// ❌ 不好的做法
function handleAdventure(player: any) {
  // ...
}
```

### React

- 使用函数组件
- 使用 Hooks 管理状态
- 组件 Props 要有明确的类型

```typescript
// ✅ 好的做法
interface Props {
  player: PlayerStats;
  onClose: () => void;
}

export default function Component({ player, onClose }: Props) {
  // ...
}

// ❌ 不好的做法
export default function Component(props: any) {
  // ...
}
```

### 命名规范

- **组件**: PascalCase (`StatsPanel.tsx`)
- **函数**: camelCase (`handleAdventure`)
- **常量**: UPPER_SNAKE_CASE (`REALM_DATA`)
- **类型/接口**: PascalCase (`PlayerStats`)

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

### 手动测试

提交代码前，请测试：

- [ ] 新功能正常工作
- [ ] 不影响现有功能
- [ ] 在不同浏览器中测试（Chrome、Firefox、Safari）
- [ ] 响应式设计正常（移动端和桌面端）

### 类型检查

```bash
npx tsc --noEmit
```

确保没有 TypeScript 类型错误。

## 📚 文档

### 更新文档

如果添加了新功能或修改了现有功能：

1. 更新相关文档（`doc/` 目录）
2. 更新 README.md（如果需要）
3. 添加代码注释（如果代码复杂）

### 文档规范

- 使用 Markdown 格式
- 保持文档清晰和准确
- 添加示例代码（如果适用）

## 🎯 贡献方向

### 急需贡献

- [ ] 添加单元测试
- [ ] 优化性能
- [ ] 改进 UI/UX
- [ ] 添加新功能
- [ ] 修复 Bug
- [ ] 改进文档

### 功能建议

- [ ] 添加更多境界
- [ ] 添加更多功法
- [ ] 添加更多灵宠
- [ ] 添加更多成就
- [ ] 添加更多商店
- [ ] 添加更多秘境

### 技术改进

- [ ] 代码重构
- [ ] 性能优化
- [ ] 类型安全改进
- [ ] 错误处理改进
- [ ] 可访问性改进

## 🔍 Code Review

### 提交 PR 前检查

- [ ] 代码符合规范
- [ ] 没有 TypeScript 错误
- [ ] 没有控制台错误
- [ ] 代码已测试
- [ ] 文档已更新
- [ ] 提交信息清晰

### Review 流程

1. 提交 PR
2. 等待维护者 Review
3. 根据反馈修改代码
4. 维护者合并 PR

## 📞 获取帮助

### 问题

- 查看 [Issues](https://github.com/JeasonLoop/react-xiuxian-game/issues)
- 查看 [文档](../doc/)
- 创建新 Issue 提问

### 讨论

- 在 GitHub Discussions 中讨论
- 在 Issue 中讨论

## 📄 许可证

贡献的代码将使用与项目相同的许可证（MIT）。

## 🙏 致谢

感谢所有贡献者的支持！你的贡献让这个项目变得更好。

---

**让我们一起打造更好的修仙游戏！** 🌟
