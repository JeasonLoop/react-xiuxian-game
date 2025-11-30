# 代码拆分迁移指南

## 概述

将 `App.tsx` 中的功能按模块拆分到 `features/` 文件夹下，每个模块包含对应的 hooks。

## 已完成

- ✅ `features/meditation/useMeditation.ts` - 打坐功能
- ✅ `features/battle/useBattleModal.ts` - 战斗弹窗
- ✅ `features/modal/useModalState.ts` - 模态框状态管理
- ✅ `features/game/useGameCooldown.ts` - 游戏冷却和加载

## 待完成

### 1. Adventure 模块 (`features/adventure/`)

需要创建的hooks:

- `useAdventure.ts` - 包含 `handleAdventure`, `handleEnterRealm`, `executeAdventure`

需要迁移的函数:

- `handleAdventure` (行 1126)
- `handleEnterRealm` (行 1160)
- `executeAdventure` (行 258) - 最复杂，包含物品处理、灵宠处理等

### 2. Breakthrough 模块 (`features/breakthrough/`)

需要创建的hooks:

- `useBreakthrough.ts` - 包含 `handleBreakthrough`, `handleUseInheritance`

需要迁移的函数:

- `handleBreakthrough` (行 1328)
- `handleUseInheritance` (行 1196)
- `checkLevelUp` (行 1191)

### 3. Items 模块 (`features/items/`)

需要创建的hooks:

- `useItems.ts` - 包含 `handleUseItem`, `handleDiscardItem`

需要迁移的函数:

- `handleUseItem` (行 1454)
- `handleDiscardItem` (行 1575)

### 4. Equipment 模块 (`features/equipment/`)

需要创建的hooks:

- `useEquipment.ts` - 包含装备相关所有函数

需要迁移的函数:

- `handleEquipItem` (行 1707)
- `handleUnequipItem` (行 1968)
- `handleRefineNatalArtifact` (行 1813)
- `handleUnrefineNatalArtifact` (行 1911)
- `handleOpenUpgrade` (行 2014)
- `handleUpgradeItem` (行 2019)

### 5. Shop 模块 (`features/shop/`)

需要创建的hooks:

- `useShop.ts` - 包含商店相关所有函数

需要迁移的函数:

- `handleOpenShop` (行 1593)
- `handleBuyItem` (行 1603)
- `handleSellItem` (行 1674)

### 6. Cultivation 模块 (`features/cultivation/`)

需要创建的hooks:

- `useCultivation.ts` - 包含功法相关函数

需要迁移的函数:

- `handleLearnArt` (行 2123)
- `handleActivateArt` (行 2156)

### 7. Alchemy 模块 (`features/alchemy/`)

需要创建的hooks:

- `useAlchemy.ts` - 包含炼丹相关函数

需要迁移的函数:

- `handleCraft` (行 2162)

### 8. Sect 模块 (`features/sect/`)

需要创建的hooks:

- `useSect.ts` - 包含宗门相关所有函数

需要迁移的函数:

- `handleJoinSect` (行 2263)
- `handleLeaveSect` (行 2293)
- `handleSectTask` (行 2304)
- `handleSectPromote` (行 2434)
- `handleSectBuy` (行 2455)

### 9. Character 模块 (`features/character/`)

需要创建的hooks:

- `useCharacter.ts` - 包含角色相关函数

需要迁移的函数:

- `handleSelectTalent` (行 2519)
- `handleSelectTitle` (行 2525)
- `handleAllocateAttribute` (行 2564)

### 10. Achievements 模块 (`features/achievements/`)

需要创建的hooks:

- `useAchievements.ts` - 包含成就相关函数

需要迁移的函数:

- `checkAchievements` (行 2598)

### 11. Pets 模块 (`features/pets/`)

需要创建的hooks:

- `usePets.ts` - 包含灵宠相关所有函数

需要迁移的函数:

- `handleActivatePet` (行 2717)
- `handleFeedPet` (行 2724)
- `handleEvolvePet` (行 2861)

### 12. Lottery 模块 (`features/lottery/`)

需要创建的hooks:

- `useLottery.ts` - 包含抽奖相关函数

需要迁移的函数:

- `handleDraw` (行 2900)

## Hook 创建模板

每个 hook 的基本结构:

```typescript
import { useCallback } from 'react';
import { PlayerStats, ... } from '../../types';

interface UseXXXParams {
  player: PlayerStats | null;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerStats | null>>;
  addLog: (message: string, type?: string) => void;
  // ... 其他需要的参数
}

export function useXXX({
  player,
  setPlayer,
  addLog,
  // ...
}: UseXXXParams) {
  const handleXXX = useCallback(() => {
    // 迁移 App.tsx 中的对应函数逻辑
  }, [dependencies]);

  return {
    handleXXX,
    // ... 其他返回的函数
  };
}
```

## 使用方式

在 `App.tsx` 中导入并使用:

```typescript
import { useMeditation, useBattleModal, ... } from './features';

function App() {
  // ... 基础状态和hooks

  const { handleMeditate } = useMeditation({
    player,
    setPlayer,
    addLog,
    setCooldown,
    loading,
    cooldown,
  });

  // ... 其他hooks

  return (
    // ... JSX
  );
}
```

## 注意事项

1. **依赖关系**: 确保所有需要的依赖都通过参数传入
2. **状态管理**: 使用 `setPlayer` 等状态更新函数，不要直接修改状态
3. **日志记录**: 使用 `addLog` 函数记录日志
4. **类型安全**: 保持完整的 TypeScript 类型定义
5. **性能优化**: 使用 `useCallback` 包装回调函数

## 迁移步骤

1. 从 `App.tsx` 中找到对应的函数
2. 创建对应的 hook 文件
3. 将函数逻辑迁移到 hook 中
4. 在 `App.tsx` 中使用新的 hook
5. 测试功能是否正常
6. 删除 `App.tsx` 中的旧代码
