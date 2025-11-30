# Features 模块结构

本文件夹按功能模块组织游戏逻辑，每个模块包含对应的hooks和工具函数。

## 目录结构

- `meditation/` - 打坐功能
- `adventure/` - 历练和秘境功能
- `breakthrough/` - 突破功能
- `items/` - 物品管理（使用、丢弃）
- `equipment/` - 装备系统（装备、卸下、本命法宝、升级）
- `shop/` - 商店系统
- `cultivation/` - 功法系统
- `alchemy/` - 炼丹系统
- `sect/` - 宗门系统
- `character/` - 角色系统
- `achievements/` - 成就系统
- `pets/` - 灵宠系统
- `lottery/` - 抽奖系统
- `battle/` - 战斗相关
- `modal/` - 模态框状态管理
- `game/` - 游戏通用功能（冷却、加载等）

## 使用方式

所有hooks通过 `features/index.ts` 统一导出，在 `App.tsx` 中导入使用。
