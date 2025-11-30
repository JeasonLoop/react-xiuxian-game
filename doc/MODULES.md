# 📦 模块和目录解析

本文档详细说明项目的目录结构、各模块的功能和代码组织方式。

## 📁 目录结构

```
react-xiuxian-game/
├── components/              # React 组件
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
│   └── StatsPanel.tsx          # 属性显示面板
│
├── services/               # 业务逻辑服务
│   ├── aiService.ts       # AI 事件生成服务
│   ├── battleService.ts   # 战斗系统服务
│   └── randomService.ts   # 随机事件服务
│
├── api/                    # API 代理层
│   └── proxy.js           # Vercel Serverless Function
│
├── doc/                    # 项目文档
│
├── App.tsx                 # 主应用组件（状态管理核心）
├── index.tsx               # 应用入口文件
├── types.ts                # TypeScript 类型定义
├── constants.ts            # 游戏常量配置
├── vite.config.ts          # Vite 构建配置
├── vercel.json             # Vercel 部署配置
├── package.json            # 项目依赖配置
└── tsconfig.json           # TypeScript 配置
```

## 🧩 核心模块详解

### 1. App.tsx - 主应用组件

**职责**:

- 全局状态管理
- 游戏核心逻辑协调
- 事件处理分发
- 数据持久化

**关键状态**:

```typescript
- player: PlayerStats          // 玩家数据
- logs: LogEntry[]            // 游戏日志
- settings: GameSettings      // 游戏设置
- 各种 Modal 的开关状态
```

**核心功能**:

- 游戏初始化 (`handleStartGame`)
- 历练系统 (`handleAdventure`)
- 修炼系统 (`handleMeditate`, `handleBreakthrough`)
- 装备系统 (`handleEquip`, `handleUnequip`)
- 存档系统 (`saveGame`, `loadGame`)

**代码规模**: ~3100 行（包含所有游戏逻辑）

### 2. types.ts - 类型定义

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

### 3. constants.ts - 游戏常量

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

### 4. services/ - 服务层

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

### 5. components/ - UI 组件层

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
App.tsx (核心)
  ├── components/* (UI 组件)
  ├── services/* (业务逻辑)
  ├── types.ts (类型定义)
  └── constants.ts (常量配置)

services/
  ├── aiService.ts
  │   └── types.ts
  ├── battleService.ts
  │   ├── types.ts
  │   ├── constants.ts
  │   └── aiService.ts (生成敌人名称)
  └── randomService.ts
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

- **UI 逻辑** → `components/`
- **业务逻辑** → `services/`
- **数据定义** → `types.ts`, `constants.ts`
- **状态管理** → `App.tsx`

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

3. **实现服务** (`services/newFeatureService.ts`)

   ```typescript
   export const newFeatureFunction = () => {
     // ...
   };
   ```

4. **创建组件** (`components/NewFeatureModal.tsx`)

   ```typescript
   export default function NewFeatureModal({ ... }) {
     // ...
   }
   ```

5. **集成到 App** (`App.tsx`)
   ```typescript
   const [isNewFeatureOpen, setIsNewFeatureOpen] = useState(false);
   // ...
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

- **行数**: ~3100 行
- **职责**: 游戏核心逻辑
- **关键函数**:
  - `handleAdventure()` - 历练处理
  - `handleMeditate()` - 打坐修炼
  - `handleBreakthrough()` - 突破境界
  - `handleEquip()` - 装备物品
  - `checkAchievements()` - 成就检查

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
