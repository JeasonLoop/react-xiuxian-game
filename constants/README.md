# 常量文件结构说明

本目录包含游戏的所有常量定义，按功能模块组织。

## 文件组织

### 核心系统
- **realms.ts** - 境界系统（境界顺序、境界数据）
- **cultivation.ts** - 功法系统（功法定义、功法战斗技能）
- **spiritualRoots.ts** - 灵根系统（灵根计算、属性加成）

### 物品系统
- **items.ts** - 物品基础数据（初始物品、丹方、丹药定义、强化相关）
- **itemTemplates.ts** - 物品模板系统（自动生成的装备、丹药、草药、材料模板）
- **equipment.ts** - 装备模板（从物品模板中提取的可装备物品）

### 功能模块
- **sects.ts** - 宗门系统（宗门定义、职位、商店）
- **secretRealms.ts** - 秘境系统（秘境定义）
- **pets.ts** - 灵宠系统（灵宠模板、技能、进化材料）
- **battle.ts** - 战斗系统（战斗技能、战斗丹药）
- **talents.ts** - 天赋称号系统（天赋、称号、成就、奇遇）

### 进阶系统
- **advanced.ts** - 进阶物品系统（筑基奇物、天地精华、天地之髓、规则之力）
- **heavenEarth.ts** - 天地之魄系统（BOSS、合道期挑战）
- **tribulation.ts** - 渡劫系统（天劫配置、渡劫阶段、死亡概率）

### 游戏功能
- **lottery.ts** - 抽奖系统（抽奖奖品定义）
- **shop.ts** - 商店系统（商店定义、商店物品）
- **dailyQuest.ts** - 日常任务系统（任务配置、奖励计算）
- **grotto.ts** - 洞府系统（洞府配置、种植、聚灵阵、药园）

### 工具常量
- **storageKeys.ts** - 存储键（localStorage/sessionStorage 键名）
- **emojis.ts** - 表情包配置（表情分类、快捷方式）

## 使用方式

所有常量通过 `constants/index.ts` 统一导出，可以直接从 `constants` 导入：

```typescript
import { REALM_DATA, LOTTERY_PRIZES, EQUIPMENT_TEMPLATES } from '../constants';
```

或者从具体文件导入：

```typescript
import { ITEM_TEMPLATES } from '../constants/itemTemplates';
import { STORAGE_KEYS } from '../constants/storageKeys';
```

## 文件命名规范

- 使用小写字母开头
- 多个单词使用驼峰命名（如 `dailyQuest.ts`）
- 文件名应该清晰表达文件内容

## 添加新常量

1. 确定常量所属的功能模块
2. 在对应的文件中添加常量定义
3. 确保在 `constants/index.ts` 中导出（如果使用 `export *` 则自动导出）
4. 添加必要的类型定义和注释

## 注意事项

- 所有常量文件都应该有清晰的文件头注释
- 使用 TypeScript 类型确保类型安全
- 避免循环依赖
- 大型数据定义（如抽奖奖品）可以单独放在一个文件中

