# Views 模块

本文件夹包含所有视图组件，负责UI展示和用户交互。

## 目录结构

### 核心组件

- `GameView.tsx` - 主游戏视图，整合所有游戏界面和功能模块
- `GameHeader.tsx` - 游戏头部导航栏，包含菜单按钮和功能入口
- `ActionBar.tsx` - 操作按钮栏，提供打坐、历练、秘境、炼丹、宗门等核心操作
- `NotificationToast.tsx` - 通知弹窗组件，用于显示购买成功、抽奖奖励等提示信息
- `index.ts` - 统一导出所有 views 模块的 handlers 和组件

### 功能模块

每个功能模块都遵循统一的组织结构：

- `index.ts` - 模块导出文件
- `useXxxHandlers.ts` - 业务逻辑处理函数（自定义 Hook）

#### 基础功能模块

- `meditation/` - 打坐修炼系统
  - 提供打坐相关的业务逻辑处理函数
- `breakthrough/` - 突破系统
  - 处理境界突破相关逻辑
- `battle/` - 战斗系统
  - 处理战斗相关的业务逻辑

#### 物品和装备模块

- `items/` - 物品系统
  - 处理物品使用、管理等相关逻辑
- `equipment/` - 装备系统
  - 处理装备穿戴、卸下等逻辑

#### 游戏系统模块

- `cultivation/` - 修炼/功法系统
  - 处理功法学习、修炼等相关逻辑
- `alchemy/` - 炼丹系统
  - 处理丹药炼制相关逻辑
- `character/` - 角色系统
  - 处理角色属性、信息展示等逻辑
- `adventure/` - 历练/冒险系统
  - 处理历练事件、战斗等逻辑
  - 包含 `executeAdventureCore.ts` - 历练核心执行逻辑

#### 社交和扩展模块

- `sect/` - 宗门系统
  - 处理宗门任务、晋升等相关逻辑
- `pet/` - 灵宠系统
  - 处理灵宠培养、战斗等逻辑
- `achievement/` - 成就系统
  - 处理成就解锁、展示等逻辑
- `lottery/` - 抽奖系统
  - 处理抽奖相关逻辑

#### 商店和设置模块

- `shop/` - 商店系统
  - 处理商店购买、出售等逻辑
- `settings/` - 设置系统
  - 处理游戏设置相关逻辑
- `realm/` - 秘境系统
  - 处理秘境探索相关逻辑

#### UI 容器模块

- `modals/` - 模态框容器
  - `ModalsContainer.tsx` - 统一管理所有模态框的显示和状态
  - 包含各种功能面板的模态框组件

## 设计原则

### 架构设计

1. **关注点分离**
   - Views 只负责 UI 展示，不包含业务逻辑
   - 业务逻辑通过 `useXxxHandlers.ts` 自定义 Hook 封装
   - 业务逻辑通过 props 从父组件传入

2. **模块化组织**
   - 每个功能模块独立文件夹
   - 统一的文件命名规范（`index.ts` + `useXxxHandlers.ts`）
   - 通过 `index.ts` 统一导出，便于使用

3. **类型安全**
   - 使用 TypeScript 确保类型安全
   - 所有组件和函数都有明确的类型定义

4. **单一职责**
   - 每个组件只负责一个功能
   - Handlers 只处理特定模块的业务逻辑

### 使用模式

```typescript
// 在父组件中使用 handlers
import { useShopHandlers } from './views';

const { handleOpenShop, handleBuyItem, handleSellItem } = useShopHandlers({
  player,
  setPlayer,
  addLog,
  // ... 其他依赖
});

// 在组件中使用
<ShopModal
  onBuy={handleBuyItem}
  onSell={handleSellItem}
  // ... 其他 props
/>
```

## 模块说明

### Handlers 模式

每个功能模块的 `useXxxHandlers.ts` 文件：

- 接收必要的依赖（player、setPlayer、addLog 等）
- 返回该模块相关的所有处理函数
- 封装业务逻辑，保持组件纯净

### 组件导出

- 核心组件通过 `views/index.ts` 统一导出
- 功能模块的 handlers 通过 `views/index.ts` 统一导出
- 便于在应用的其他部分使用

## 注意事项

1. **不要直接在组件中编写业务逻辑**，应使用对应的 handlers
2. **保持组件的可复用性**，通过 props 传递数据和回调
3. **遵循命名规范**，handlers 文件统一使用 `useXxxHandlers.ts` 格式
4. **保持类型安全**，所有 props 和返回值都应该有明确的类型定义
