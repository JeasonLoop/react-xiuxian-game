# 📦 模块和目录解析

本文档详细说明项目的目录结构、各模块的功能和代码组织方式。

## 📁 目录结构

```
react-xiuxian-game/
├── components/              # UI 组件层（纯展示组件）
│   ├── AchievementModal.tsx    # 成就系统弹窗
│   ├── AlchemyModal.tsx        # 炼丹系统弹窗
│   ├── ArtifactUpgradeModal.tsx # 法宝强化弹窗
│   ├── BattleModal.tsx         # 战斗系统弹窗
│   ├── CharacterModal.tsx       # 角色信息弹窗
│   ├── CombatVisuals.tsx       # 战斗视觉效果组件
│   ├── CultivationModal.tsx     # 修炼系统弹窗
│   ├── EquipmentPanel.tsx      # 装备面板组件
│   ├── InventoryModal.tsx       # 背包系统弹窗
│   ├── LogPanel.tsx            # 游戏日志面板
│   ├── LotteryModal.tsx        # 抽奖系统弹窗
│   ├── MobileSidebar.tsx       # 移动端侧边栏
│   ├── PetModal.tsx            # 灵宠系统弹窗
│   ├── SecretRealmModal.tsx    # 秘境探索弹窗
│   ├── SectModal.tsx           # 宗门系统弹窗
│   ├── SettingsModal.tsx       # 游戏设置弹窗
│   ├── ShopModal.tsx           # 商店系统弹窗
│   ├── StartScreen.tsx         # 游戏开始界面
│   ├── WelcomeScreen.tsx       # 欢迎界面
│   ├── DeathModal.tsx          # 死亡弹窗
│   ├── BatchDiscardModal.tsx   # 批量丢弃弹窗
│   └── StatsPanel.tsx          # 属性显示面板
│
├── views/                  # 视图层（业务逻辑 + UI 组合）
│   ├── GameView.tsx           # 主游戏视图
│   ├── GameHeader.tsx         # 游戏头部导航
│   ├── ActionBar.tsx          # 操作按钮栏
│   ├── NotificationToast.tsx  # 通知弹窗
│   ├── ModalsContainer.tsx    # 弹窗容器
│   ├── adventure/              # 历练模块
│   │   ├── index.ts
│   │   ├── useAdventureHandlers.ts
│   │   └── executeAdventureCore.ts
│   ├── meditation/             # 打坐模块
│   │   ├── index.ts
│   │   └── useMeditationHandlers.ts
│   ├── breakthrough/           # 突破模块
│   │   ├── index.ts
│   │   └── useBreakthroughHandlers.ts
│   ├── battle/                 # 战斗模块
│   │   ├── index.ts
│   │   └── useBattleHandlers.ts
│   ├── items/                  # 物品模块
│   │   ├── index.ts
│   │   └── useItemHandlers.ts
│   ├── equipment/              # 装备模块
│   │   ├── index.ts
│   │   └── useEquipmentHandlers.ts
│   ├── cultivation/            # 修炼模块
│   │   ├── index.ts
│   │   └── useCultivationHandlers.ts
│   ├── alchemy/                # 炼丹模块
│   │   ├── index.ts
│   │   └── useAlchemyHandlers.ts
│   ├── character/              # 角色模块
│   │   ├── index.ts
│   │   └── useCharacterHandlers.ts
│   ├── shop/                   # 商店模块
│   │   ├── index.ts
│   │   └── useShopHandlers.ts
│   ├── settings/               # 设置模块
│   │   ├── index.ts
│   │   └── useSettingsHandlers.ts
│   ├── realm/                  # 秘境模块
│   │   ├── index.ts
│   │   └── useRealmHandlers.ts
│   ├── pet/                    # 灵宠模块
│   │   ├── index.ts
│   │   └── usePetHandlers.ts
│   ├── lottery/                # 抽奖模块
│   │   ├── index.ts
│   │   └── useLotteryHandlers.ts
│   ├── sect/                   # 宗门模块
│   │   ├── index.ts
│   │   └── useSectHandlers.ts
│   └── achievement/            # 成就模块
│       ├── index.ts
│       └── useAchievementHandlers.ts
│
├── features/               # 功能模块（可复用的 Hooks）
│   ├── battle/                 # 战斗相关
│   │   └── useBattleModal.ts
│   ├── game/                   # 游戏通用功能
│   │   └── useGameCooldown.ts
│   ├── items/                  # 物品管理
│   │   └── useItems.ts
│   ├── meditation/              # 打坐功能
│   │   └── useMeditation.ts
│   ├── modal/                   # 模态框状态管理
│   │   └── useModalState.ts
│   ├── shop/                    # 商店功能
│   │   └── useShop.ts
│   ├── index.ts                 # 统一导出
│   └── README.md                # 功能模块说明
│
├── hooks/                  # 通用 Hooks
│   ├── useGameState.ts      # 游戏状态管理
│   └── useGameEffects.ts   # 游戏副作用处理
│
├── utils/                  # 工具函数
│   ├── gameUtils.ts        # 游戏工具函数
│   ├── itemUtils.ts        # 物品工具函数
│   └── playerUtils.ts      # 玩家工具函数
│
├── services/               # 业务逻辑服务层
│   ├── aiService.ts        # AI 事件生成服务
│   ├── battleService.ts   # 战斗系统服务
│   └── randomService.ts   # 随机事件服务
│
├── config/                 # 配置文件
│   ├── aiConfig.ts        # AI 配置（支持多提供商）
│   └── README.md          # 配置说明
│
├── api/                    # API 代理层
│   └── proxy.js           # Vercel Serverless Function
│
├── assets/                 # 静态资源
│   └── images/            # 图片资源
│
├── doc/                    # 项目文档
│
├── App.tsx                 # 主应用组件（协调器）
├── index.tsx               # 应用入口文件
├── types.ts                # TypeScript 类型定义
├── constants.ts            # 游戏常量配置
├── vite.config.ts          # Vite 构建配置
├── vercel.json             # Vercel 部署配置
├── package.json            # 项目依赖配置
└── tsconfig.json           # TypeScript 配置
```

## 🧩 核心模块详解

### 1. App.tsx - 主应用组件（协调器）

**职责**:

- 应用入口和路由协调
- 全局状态管理（通过 `useGameState`）
- 模块整合和 Handlers 调用
- 欢迎界面和游戏视图切换

**关键状态**:

通过 `useGameState` Hook 管理：

```typescript
- player: PlayerStats          // 玩家数据
- logs: LogEntry[]            // 游戏日志
- settings: GameSettings      // 游戏设置
- gameStarted: boolean        // 游戏是否开始
- hasSave: boolean            // 是否有存档
```

**核心功能**:

- 使用 `useGameState` 管理全局状态
- 使用 `useGameEffects` 处理副作用（自动保存等）
- 导入并使用各模块的 Handlers
- 渲染 `GameView` 和 `ModalsContainer`

**代码规模**: 大幅简化，主要作为协调器

### 2. hooks/ - 状态管理 Hooks

#### useGameState.ts

**职责**: 封装游戏全局状态管理逻辑

**核心功能**:

- 状态初始化（从 localStorage 加载）
- 状态更新方法
- 存档和读档
- 游戏开始处理

**返回**:

```typescript
{
  hasSave: boolean;
  gameStarted: boolean;
  player: PlayerStats;
  setPlayer: (player: PlayerStats) => void;
  settings: GameSettings;
  setSettings: (settings: GameSettings) => void;
  logs: LogEntry[];
  setLogs: (logs: LogEntry[]) => void;
  handleStartGame: (playerName: string) => void;
  setGameStarted: (started: boolean) => void;
}
```

#### useGameEffects.ts

**职责**: 处理游戏副作用

**核心功能**:

- 自动保存游戏状态
- 成就检查
- 其他副作用处理

### 3. views/ - 视图层

**职责**: 组合 UI 组件，处理用户交互，调用业务逻辑

**组织方式**:

每个功能模块包含：
- `index.ts` - 模块导出（导出 Handlers 和组件）
- `useXxxHandlers.ts` - 业务逻辑处理函数（自定义 Hook）

**核心视图组件**:

#### GameView.tsx

- 主游戏视图，整合所有游戏界面
- 使用各模块的 Handlers
- 渲染游戏头部、操作栏、属性面板等

#### GameHeader.tsx

- 游戏头部导航栏
- 菜单按钮和功能入口

#### ActionBar.tsx

- 操作按钮栏
- 提供打坐、历练、秘境、炼丹、宗门等核心操作

#### ModalsContainer.tsx

- 统一管理所有模态框的显示和状态
- 包含各种功能面板的模态框组件

**Handlers 模式**:

每个模块的 `useXxxHandlers.ts` 文件：

```typescript
export function useXxxHandlers({
  player,
  setPlayer,
  addLog,
  // ... 其他依赖
}) {
  const handleAction = useCallback(() => {
    // 业务逻辑
    // 调用 services 或 utils
    // 更新状态
  }, [dependencies]);
  
  return { handleAction, ... };
}
```

### 4. features/ - 功能模块

**职责**: 提供可复用的功能 Hooks

**特点**:

- 功能导向的组织方式
- 跨模块共享的功能
- 独立的功能模块

**主要模块**:

- `battle/useBattleModal.ts` - 战斗弹窗状态管理
- `game/useGameCooldown.ts` - 游戏冷却时间管理
- `modal/useModalState.ts` - 模态框状态管理
- `items/useItems.ts` - 物品管理功能
- `meditation/useMeditation.ts` - 打坐功能
- `shop/useShop.ts` - 商店功能

### 5. utils/ - 工具函数

**职责**: 提供通用的工具函数

**核心工具**:

#### gameUtils.ts

- 游戏通用工具函数
- 存档/读档相关函数
- 游戏状态验证

#### itemUtils.ts

- 物品相关工具函数
- 物品查找、过滤、排序
- 物品效果计算

#### playerUtils.ts

- 玩家相关工具函数
- 属性计算
- 玩家数据验证

### 6. config/ - 配置文件

**职责**: 管理应用配置

**核心配置**:

#### aiConfig.ts

- AI 服务配置
- 支持多种 AI 提供商（SiliconFlow、OpenAI 等）
- 环境变量管理
- 配置验证

**特点**:

- 灵活的配置系统
- 支持多提供商切换
- 环境变量配置

### 7. types.ts - 类型定义

**职责**: 定义所有 TypeScript 类型和接口

**核心类型**:

#### 玩家相关

```typescript
interface PlayerStats {
  name: string;
  realm: RealmType;
  realmLevel: number;
  exp: number;
  maxExp: number;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  spirit: number;
  physique: number;
  speed: number;
  luck: number;
  // ... 更多属性
}
```

#### 物品相关

```typescript
interface Item {
  id: string;
  name: string;
  type: ItemType;
  description: string;
  quantity: number;
  rarity?: ItemRarity;
  level?: number;
  effect?: {...};
  // ...
}
```

#### 其他类型

- `RealmType` - 境界枚举
- `ItemType` - 物品类型枚举
- `EquipmentSlot` - 装备槽位枚举
- `AdventureResult` - 历练结果
- `BattleReplay` - 战斗回放
- `Pet` - 灵宠数据
- `Achievement` - 成就数据

### 8. constants.ts - 游戏常量

**职责**: 定义游戏配置和常量数据

**核心常量**:

#### 境界数据

```typescript
export const REALM_DATA: Record<RealmType, {
  baseMaxHp: number;
  baseAttack: number;
  baseDefense: number;
  // ...
}> = { ... };
```

#### 功法数据

```typescript
export const CULTIVATION_ARTS: CultivationArt[] = [
  // 心法（提升修炼速度）
  // 体术（永久提升属性）
];
```

#### 其他常量

- `TALENTS` - 天赋列表
- `TITLES` - 称号列表
- `ACHIEVEMENTS` - 成就列表
- `PET_TEMPLATES` - 灵宠模板
- `LOTTERY_PRIZES` - 抽奖奖品
- `SHOPS` - 商店数据
- `SECRET_REALMS` - 秘境数据

### 9. services/ - 服务层

#### aiService.ts - AI 事件生成

**核心函数**:

```typescript
// 生成历练事件
generateAdventureEvent(
  player: PlayerStats,
  adventureType: AdventureType
): Promise<AdventureResult>

// 生成突破描述
generateBreakthroughFlavorText(
  realm: string,
  success: boolean
): Promise<string>

// 生成敌人名称
generateEnemyName(
  realm: RealmType,
  adventureType: AdventureType
): Promise<{ name: string; title: string }>
```

**特点**:

- 使用 SiliconFlow API
- 支持多种事件类型（普通、机缘、秘境）
- 自动清理和解析 JSON 响应
- 错误处理和降级方案

#### battleService.ts - 战斗系统

**核心函数**:

```typescript
// 判断是否触发战斗
shouldTriggerBattle(
  player: PlayerStats,
  adventureType: AdventureType
): boolean

// 解析战斗结果
resolveBattleEncounter(
  player: PlayerStats,
  adventureType: AdventureType
): Promise<BattleResolution>
```

**战斗机制**:

- 回合制战斗
- 基于速度的行动顺序
- 暴击系统
- 伤害计算
- 搜刮奖励系统

#### randomService.ts - 随机事件

**职责**: 生成随机宗门任务等随机事件

### 10. components/ - UI 组件层

#### 弹窗组件 (Modal Components)

所有弹窗组件都遵循相同的模式：

```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerStats;
  // ... 其他 props
}
```

**主要弹窗**:

1. **AchievementModal** - 成就系统
   - 显示所有成就
   - 显示完成状态
   - 显示奖励

2. **AlchemyModal** - 炼丹系统
   - 显示配方列表
   - 材料检查
   - 炼制丹药

3. **BattleModal** - 战斗系统
   - 显示战斗回放
   - 逐回合展示
   - 战斗结果

4. **CharacterModal** - 角色信息
   - 显示角色属性
   - 显示天赋和称号
   - 属性点分配

5. **CultivationModal** - 修炼系统
   - 打坐修炼
   - 突破境界
   - 学习功法

6. **InventoryModal** - 背包系统
   - 物品列表
   - 物品使用
   - 物品出售

7. **PetModal** - 灵宠系统
   - 灵宠列表
   - 灵宠培养
   - 灵宠进化

8. **SectModal** - 宗门系统
   - 宗门信息
   - 宗门任务
   - 宗门商店

9. **ShopModal** - 商店系统
   - 商品列表
   - 购买/出售
   - 价格显示

10. **SettingsModal** - 游戏设置
    - 音效设置
    - 动画速度
    - 自动保存

#### 面板组件 (Panel Components)

1. **StatsPanel** - 属性面板
   - 显示玩家属性
   - 快速操作按钮

2. **LogPanel** - 日志面板
   - 显示游戏日志
   - 日志分类显示

3. **EquipmentPanel** - 装备面板
   - 显示已装备物品
   - 装备槽位管理

#### 其他组件

1. **StartScreen** - 开始界面
   - 游戏开始
   - 角色创建

2. **CombatVisuals** - 战斗视觉效果
   - 伤害数字
   - 治疗效果
   - 技能特效

3. **MobileSidebar** - 移动端侧边栏
   - 响应式设计
   - 移动端导航

## 🔗 模块依赖关系

```
App.tsx (协调器)
  ├── hooks/
  │   ├── useGameState.ts (状态管理)
  │   └── useGameEffects.ts (副作用处理)
  ├── views/
  │   ├── GameView.tsx (主视图)
  │   ├── ModalsContainer.tsx (弹窗容器)
  │   └── */useXxxHandlers.ts (业务逻辑 Handlers)
  └── components/* (UI 组件)

views/*/useXxxHandlers.ts
  ├── features/* (可复用功能 Hooks)
  ├── services/* (业务逻辑服务)
  ├── utils/* (工具函数)
  ├── types.ts (类型定义)
  └── constants.ts (常量配置)

services/
  ├── aiService.ts
  │   ├── config/aiConfig.ts (AI 配置)
  │   └── types.ts
  ├── battleService.ts
  │   ├── types.ts
  │   ├── constants.ts
  │   └── aiService.ts (生成敌人名称)
  └── randomService.ts
      └── types.ts

features/*
  ├── services/* (业务逻辑服务)
  ├── utils/* (工具函数)
  └── types.ts

components/*
  ├── types.ts
  └── constants.ts (部分组件)
```

## 📊 代码组织原则

### 1. 单一职责原则

每个模块/组件只负责一个功能：

- `BattleModal` 只负责战斗显示
- `battleService` 只负责战斗计算
- `aiService` 只负责 AI 交互

### 2. 关注点分离

- **UI 展示** → `components/` (纯展示组件)
- **视图组合** → `views/` (组合组件 + Handlers)
- **业务逻辑** → `services/`, `utils/` (服务层和工具函数)
- **功能复用** → `features/` (可复用的功能 Hooks)
- **状态管理** → `hooks/` (状态管理 Hooks)
- **数据定义** → `types.ts`, `constants.ts`
- **配置管理** → `config/`

### 3. 可复用性

- 通用组件可复用（如 `Modal` 基础结构）
- 服务函数可复用（如 `generateAdventureEvent`）
- 类型定义可复用（如 `PlayerStats`）

### 4. 可测试性

- 服务层函数是纯函数，易于测试
- 组件通过 props 接收依赖，易于 mock
- 业务逻辑与 UI 分离

## 🎯 模块扩展指南

### 添加新功能模块

1. **定义类型** (`types.ts`)

   ```typescript
   export interface NewFeature {
     // ...
   }
   ```

2. **定义常量** (`constants.ts`)

   ```typescript
   export const NEW_FEATURE_DATA = {
     // ...
   };
   ```

3. **实现服务** (`services/newFeatureService.ts`) 或工具函数 (`utils/`)

   ```typescript
   export const newFeatureFunction = () => {
     // ...
   };
   ```

4. **创建 UI 组件** (`components/NewFeatureModal.tsx`)

   ```typescript
   export default function NewFeatureModal({ ... }) {
     // ...
   }
   ```

5. **创建视图 Handlers** (`views/newFeature/useNewFeatureHandlers.ts`)

   ```typescript
   export function useNewFeatureHandlers({ player, setPlayer, addLog }) {
     const handleAction = useCallback(() => {
       // 业务逻辑
     }, [dependencies]);
     
     return { handleAction };
   }
   ```

6. **导出模块** (`views/newFeature/index.ts`)

   ```typescript
   export { useNewFeatureHandlers } from './useNewFeatureHandlers';
   ```

7. **在 GameView 中使用** (`views/GameView.tsx`)

   ```typescript
   import { useNewFeatureHandlers } from './newFeature';
   
   const { handleAction } = useNewFeatureHandlers({ ... });
   ```

### 添加新境界

1. 在 `types.ts` 中添加枚举值
2. 在 `constants.ts` 中添加境界数据
3. 更新 `REALM_ORDER` 数组

### 添加新物品

1. 在 `constants.ts` 中添加物品定义
2. 或通过 AI 生成（动态添加）

## 📝 代码规范

### 命名规范

- **组件**: PascalCase (`StatsPanel.tsx`)
- **函数**: camelCase (`handleAdventure`)
- **常量**: UPPER_SNAKE_CASE (`REALM_DATA`)
- **类型/接口**: PascalCase (`PlayerStats`)

### 文件组织

- 一个文件一个主要导出
- 相关功能放在同一目录
- 类型定义集中管理

### 导入顺序

```typescript
// 1. React 相关
import React, { useState } from 'react';

// 2. 第三方库
import { Sword } from 'lucide-react';

// 3. 类型定义
import { PlayerStats } from '../types';

// 4. 常量
import { REALM_DATA } from '../constants';

// 5. 服务
import { generateAdventureEvent } from '../services/aiService';

// 6. 组件
import StatsPanel from './StatsPanel';
```

## 🔍 关键文件说明

### App.tsx

- **职责**: 应用协调器
- **关键功能**:
  - 使用 `useGameState` 管理全局状态
  - 使用 `useGameEffects` 处理副作用
  - 导入各模块 Handlers
  - 渲染欢迎界面和游戏视图

### hooks/useGameState.ts

- **职责**: 游戏状态管理核心
- **关键功能**:
  - 状态初始化（从 localStorage）
  - 状态更新方法
  - 存档和读档
  - 游戏开始处理

### views/GameView.tsx

- **职责**: 主游戏视图
- **关键功能**:
  - 整合所有游戏界面
  - 使用各模块 Handlers
  - 渲染游戏头部、操作栏、属性面板等

### views/*/useXxxHandlers.ts

- **职责**: 各模块的业务逻辑处理
- **关键函数** (以 adventure 为例):
  - `handleAdventure()` - 历练处理
  - `handleMeditate()` - 打坐修炼 (meditation 模块)
  - `handleBreakthrough()` - 突破境界 (breakthrough 模块)
  - `handleEquip()` - 装备物品 (equipment 模块)

### constants.ts

- **行数**: ~1159 行
- **内容**: 所有游戏配置数据
- **关键数据**:
  - 7 大境界数据
  - 20+ 种功法
  - 20+ 种天赋
  - 10+ 种称号
  - 30+ 种成就
  - 多个商店配置

### types.ts

- **行数**: ~470 行
- **内容**: 所有 TypeScript 类型定义
- **关键类型**: 20+ 个接口和枚举

## 📚 相关文档

- [架构设计](./ARCHITECTURE.md) - 整体架构说明
- [API 文档](./API.md) - API 使用说明
- [开发指南](./DEVELOPMENT.md) - 开发实践

---

**提示**: 建议在修改代码前先阅读本文档，了解模块职责和依赖关系。
