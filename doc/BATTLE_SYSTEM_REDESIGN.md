# 回合制战斗系统重构需求文档

## 📋 概述

将现有的自动战斗系统重构为完整的回合制战斗系统，整合功法、丹药、法宝技能等元素，提供更丰富的战斗策略和玩家体验。

---

## 🎯 核心目标

1. **回合制战斗机制**: 玩家可以在每个回合主动选择行动（攻击、技能、使用丹药、防御等）
2. **功法系统整合**: 功法可以在战斗中提供被动效果和主动技能
3. **丹药战斗使用**: 战斗中可以使用丹药恢复气血、提升属性等
4. **法宝/武器技能系统**: 为法宝和武器添加主动技能，丰富战斗策略
5. **战斗策略深度**: 通过技能组合、状态效果等增加战斗深度

---

## 🏗️ 系统架构设计

### 1. 战斗回合流程

```
战斗开始
  ↓
初始化战斗状态（玩家、敌人、Buff/Debuff）
  ↓
【回合循环】
  ├─ 计算行动顺序（基于速度）
  ├─ 玩家回合
  │   ├─ 显示行动选项（攻击、技能、丹药、防御、逃跑）
  │   ├─ 玩家选择行动
  │   ├─ 执行行动
  │   └─ 更新战斗状态
  ├─ 敌人回合
  │   ├─ AI选择行动
  │   ├─ 执行行动
  │   └─ 更新战斗状态
  ├─ 处理持续效果（Buff/Debuff、持续伤害/治疗）
  └─ 检查战斗结束条件
  ↓
战斗结束（胜利/失败）
```

### 2. 数据结构设计

#### 2.1 战斗状态 (BattleState)

```typescript
interface BattleState {
  // 战斗基本信息
  id: string;
  round: number; // 当前回合数
  turn: 'player' | 'enemy'; // 当前行动方

  // 玩家状态
  player: BattleUnit;

  // 敌人状态
  enemy: BattleUnit;

  // 战斗历史
  history: BattleAction[];

  // 战斗结果
  result?: BattleResult;
}

interface BattleUnit {
  // 基础信息
  id: string;
  name: string;
  realm: RealmType;

  // 当前属性
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  spirit: number; // 神识（影响法术伤害）

  // 状态效果
  buffs: Buff[];
  debuffs: Debuff[];

  // 技能相关
  skills: BattleSkill[]; // 可用技能列表
  cooldowns: Record<string, number>; // 技能冷却时间

  // 资源
  mana?: number; // 灵力值（可选，用于技能消耗）
  energy?: number; // 能量值（可选，用于特殊技能）
}

interface Buff {
  id: string;
  name: string;
  type: 'attack' | 'defense' | 'speed' | 'heal' | 'custom';
  value: number; // 数值加成或百分比加成
  duration: number; // 剩余回合数
  source: string; // 来源（功法、丹药、技能等）
}

interface Debuff {
  id: string;
  name: string;
  type: 'poison' | 'burn' | 'freeze' | 'stun' | 'weakness' | 'custom';
  value: number;
  duration: number;
  source: string;
}
```

#### 2.2 战斗技能 (BattleSkill)

```typescript
interface BattleSkill {
  id: string;
  name: string;
  description: string;
  type: 'attack' | 'defense' | 'heal' | 'buff' | 'debuff' | 'special';

  // 技能来源
  source: 'cultivation_art' | 'artifact' | 'weapon' | 'potion' | 'innate';
  sourceId: string; // 来源ID（功法ID、法宝ID等）

  // 技能效果
  effects: SkillEffect[];

  // 消耗
  cost: {
    mana?: number; // 灵力消耗
    energy?: number; // 能量消耗
    hp?: number; // 气血消耗（自残技能）
  };

  // 冷却
  cooldown: number; // 冷却回合数
  maxCooldown: number;

  // 使用条件
  conditions?: {
    minHp?: number; // 最低气血百分比
    requireBuff?: string; // 需要特定Buff
    requireDebuff?: string; // 需要特定Debuff
  };

  // 目标类型
  target: 'self' | 'enemy' | 'both';

  // 伤害/治疗计算
  damage?: {
    base: number; // 基础伤害
    multiplier: number; // 伤害倍率（基于攻击力）
    type: 'physical' | 'magical'; // 物理/法术伤害
    critChance?: number; // 暴击概率
    critMultiplier?: number; // 暴击倍率
  };

  heal?: {
    base: number;
    multiplier: number; // 基于最大气血的百分比
  };
}

interface SkillEffect {
  type: 'damage' | 'heal' | 'buff' | 'debuff' | 'status';
  target: 'self' | 'enemy' | 'both';
  value?: number;
  duration?: number;
  buffId?: string;
  debuffId?: string;
}
```

#### 2.3 战斗行动 (BattleAction)

```typescript
interface BattleAction {
  id: string;
  round: number;
  turn: 'player' | 'enemy';
  actor: string; // 行动者ID
  actionType: 'attack' | 'skill' | 'item' | 'defend' | 'flee';
  skillId?: string; // 使用的技能ID
  itemId?: string; // 使用的物品ID
  target?: string; // 目标ID
  result: {
    damage?: number;
    heal?: number;
    buffs?: Buff[];
    debuffs?: Debuff[];
    crit?: boolean;
    miss?: boolean;
    blocked?: boolean;
  };
  description: string; // 行动描述文本
}
```

---

## 🎮 功能模块设计

### 1. 功法系统在战斗中的应用

#### 1.1 心法 (Mental Arts) - 被动效果

心法在战斗中提供持续的被动效果：

```typescript
// 示例：纯阳无极功
{
  id: 'art-pure-yang-battle',
  name: '纯阳无极功',
  type: 'passive',
  effects: [
    {
      type: 'buff',
      buffId: 'pure-yang-attack',
      value: 0.15, // 攻击力提升15%
      duration: -1 // 永久（战斗期间）
    },
    {
      type: 'buff',
      buffId: 'pure-yang-crit',
      value: 0.1, // 暴击率提升10%
      duration: -1
    }
  ]
}
```

#### 1.2 体术 (Body Arts) - 主动技能

体术可以转化为战斗中的主动技能：

```typescript
// 示例：天雷剑诀
{
  id: 'art-thunder-sword-skill',
  name: '天雷剑诀',
  type: 'attack',
  source: 'cultivation_art',
  sourceId: 'art-thunder-sword',
  damage: {
    base: 50,
    multiplier: 1.5, // 150%攻击力
    type: 'magical', // 法术伤害
    critChance: 0.25,
    critMultiplier: 2.0
  },
  cost: {
    mana: 30
  },
  cooldown: 2,
  target: 'enemy',
  description: '引九天神雷入剑，对敌人造成大量法术伤害，有较高暴击率。'
}
```

#### 1.3 功法技能配置

在 `constants.ts` 中为每个功法添加战斗技能配置：

```typescript
export const CULTIVATION_ART_BATTLE_SKILLS: Record<string, BattleSkill[]> = {
  'art-thunder-sword': [
    {
      id: 'skill-thunder-sword',
      name: '天雷剑诀',
      // ... 技能配置
    }
  ],
  'art-immortal-life': [
    {
      id: 'skill-immortal-heal',
      name: '长生回春',
      type: 'heal',
      // ... 治疗技能配置
    }
  ],
  // ...
};
```

### 2. 丹药系统在战斗中的应用

#### 2.1 战斗可用丹药

在战斗中可以使用的丹药类型：

- **恢复类**: 回血丹、回春丹等
- **增益类**: 强体丹（临时提升攻击）、凝神丹（临时提升神识）等
- **特殊类**: 狂暴丹（提升攻击但降低防御）、护体丹（提升防御）等

#### 2.2 丹药战斗效果

```typescript
interface BattlePotion {
  itemId: string;
  name: string;
  type: 'heal' | 'buff' | 'debuff_removal';
  effect: {
    heal?: number;
    buffs?: Buff[];
    removeDebuffs?: string[]; // 移除的Debuff ID列表
  };
  cooldown?: number; // 使用后冷却（防止无限使用）
}

// 示例：回春丹
{
  itemId: 'potion-recovery',
  name: '回春丹',
  type: 'heal',
  effect: {
    heal: 200
  },
  cooldown: 0 // 无冷却，但消耗物品
}

// 示例：强体丹
{
  itemId: 'potion-strength',
  name: '强体丹',
  type: 'buff',
  effect: {
    buffs: [{
      id: 'strength-boost',
      name: '强体',
      type: 'attack',
      value: 50, // 攻击力+50
      duration: 3 // 持续3回合
    }]
  },
  cooldown: 5 // 使用后5回合内不能再次使用
}
```

#### 2.3 战斗中使用丹药

- 玩家回合可以选择"使用丹药"
- 显示背包中可用的战斗丹药
- 选择丹药后立即生效
- 消耗物品数量

### 3. 法宝/武器技能系统

#### 3.1 法宝技能配置

为每个法宝添加技能配置：

```typescript
interface ArtifactSkill {
  artifactId: string; // 法宝ID
  skills: BattleSkill[];
}

// 示例：星辰盘
{
  artifactId: 'artifact-star-disk',
  skills: [
    {
      id: 'skill-star-shield',
      name: '星辰护盾',
      type: 'defense',
      source: 'artifact',
      sourceId: 'artifact-star-disk',
      effects: [{
        type: 'buff',
        buffId: 'star-shield',
        value: 0.3, // 防御力提升30%
        duration: 2
      }],
      cost: {
        mana: 20
      },
      cooldown: 3,
      target: 'self'
    },
    {
      id: 'skill-star-burst',
      name: '星辰爆裂',
      type: 'attack',
      source: 'artifact',
      sourceId: 'artifact-star-disk',
      damage: {
        base: 30,
        multiplier: 1.2,
        type: 'magical',
        critChance: 0.15
      },
      cost: {
        mana: 40
      },
      cooldown: 4,
      target: 'enemy'
    }
  ]
}
```

#### 3.2 武器技能配置

为武器添加技能：

```typescript
// 示例：仙灵剑
{
  weaponId: 'weapon-immortal-sword',
  skills: [
    {
      id: 'skill-sword-dance',
      name: '剑舞',
      type: 'attack',
      source: 'weapon',
      sourceId: 'weapon-immortal-sword',
      damage: {
        base: 40,
        multiplier: 1.3,
        type: 'physical',
        critChance: 0.2
      },
      cost: {
        mana: 25
      },
      cooldown: 2,
      target: 'enemy'
    }
  ]
}
```

#### 3.3 技能解锁机制

- **普通/稀有装备**: 1个技能
- **传说装备**: 2个技能
- **仙品装备**: 3个技能

技能可以通过装备强化等级解锁更多技能槽位。

### 4. 战斗行动类型

#### 4.1 普通攻击

- 基础物理攻击
- 伤害 = (攻击力 - 敌人防御) * 随机系数(0.9-1.1)
- 有基础暴击率（5% + 速度加成）

#### 4.2 技能攻击

- 使用功法、法宝、武器技能
- 消耗灵力/能量
- 有冷却时间
- 可能有特殊效果（Buff/Debuff）

#### 4.3 防御

- 本回合防御力提升50%
- 减少受到的伤害
- 可能触发反击（某些功法/装备效果）

#### 4.4 使用丹药

- 从背包选择可用丹药
- 立即生效
- 消耗物品

#### 4.5 逃跑

- 有成功率（基于速度差）
- 失败则跳过本回合
- 成功则战斗结束（失败）

### 5. 状态效果系统

#### 5.1 Buff类型

- **攻击提升**: 增加攻击力
- **防御提升**: 增加防御力
- **速度提升**: 增加速度（影响行动顺序）
- **暴击提升**: 增加暴击率
- **持续治疗**: 每回合恢复气血
- **护盾**: 吸收伤害

#### 5.2 Debuff类型

- **中毒**: 每回合持续伤害
- **灼烧**: 每回合持续伤害（火焰）
- **冰冻**: 降低速度，可能跳过回合
- **眩晕**: 跳过本回合
- **虚弱**: 降低攻击力
- **破甲**: 降低防御力

#### 5.3 状态效果计算

- 每回合开始时处理持续效果
- 状态效果有持续时间（回合数）
- 相同类型的状态效果可以叠加或覆盖（根据设计）

---

## 🎨 UI/UX 设计

### 1. 战斗界面布局

```
┌─────────────────────────────────────────┐
│  战斗 - 第 X 回合                        │
├─────────────────────────────────────────┤
│                                         │
│  [敌人信息]                              │
│  名称: XXX · 境界: XXX                   │
│  HP: ████████░░ 800/1000               │
│  Buff/Debuff图标                        │
│                                         │
│  ─────────────────────────────────      │
│                                         │
│  [玩家信息]                              │
│  名称: XXX · 境界: XXX                   │
│  HP: ██████████ 500/500                │
│  MP: ████████░░ 80/100                 │
│  Buff/Debuff图标                        │
│                                         │
├─────────────────────────────────────────┤
│  [行动选择区域]                          │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐        │
│  │攻击 │ │技能 │ │丹药 │ │防御 │        │
│  └─────┘ └─────┘ └─────┘ └─────┘        │
│                                         │
│  [技能列表] (展开技能时显示)              │
│  • 天雷剑诀 (冷却: 1回合)                │
│  • 星辰护盾 (可用)                       │
│  • 长生回春 (可用)                       │
│                                         │
│  [丹药列表] (展开丹药时显示)              │
│  • 回春丹 x3                            │
│  • 强体丹 x1                            │
│                                         │
├─────────────────────────────────────────┤
│  [战斗日志]                              │
│  第1回合: 你使用天雷剑诀，造成150点伤害   │
│  第1回合: 敌人攻击，造成80点伤害         │
│  ...                                    │
└─────────────────────────────────────────┘
```

### 2. 技能选择界面

点击"技能"按钮后，显示可用技能列表：

- 显示技能名称、描述、伤害/效果
- 显示冷却时间（如果冷却中，显示剩余回合）
- 显示消耗（灵力/能量）
- 可用技能高亮，不可用技能灰显

### 3. 丹药选择界面

点击"丹药"按钮后，显示背包中的战斗可用丹药：

- 显示丹药名称、效果描述
- 显示数量
- 显示冷却时间（如果有）
- 可以快速使用

### 4. 战斗动画和反馈

- 技能释放时的特效动画
- 伤害数字显示（普通伤害、暴击伤害、治疗数字）
- Buff/Debuff图标动画
- 状态效果触发时的提示文本

---

## 📊 数据流设计

### 1. 战斗初始化

```typescript
function initializeBattle(
  player: PlayerStats,
  enemy: EnemyData
): BattleState {
  // 1. 创建战斗单位
  const playerUnit = createBattleUnit(player);
  const enemyUnit = createBattleUnit(enemy);

  // 2. 加载玩家技能（功法、法宝、武器）
  playerUnit.skills = [
    ...getCultivationArtSkills(player.cultivationArts, player.activeArtId),
    ...getArtifactSkills(player.equippedItems),
    ...getWeaponSkills(player.equippedItems)
  ];

  // 3. 应用被动效果（心法）
  applyPassiveEffects(playerUnit, player.cultivationArts);

  // 4. 初始化战斗状态
  return {
    id: generateId(),
    round: 1,
    turn: determineFirstTurn(playerUnit, enemyUnit),
    player: playerUnit,
    enemy: enemyUnit,
    history: []
  };
}
```

### 2. 回合执行流程

```typescript
async function executePlayerTurn(
  battleState: BattleState,
  action: PlayerAction
): Promise<BattleState> {
  // 1. 验证行动有效性
  if (!isValidAction(battleState, action)) {
    throw new Error('Invalid action');
  }

  // 2. 执行行动
  const actionResult = await executeAction(battleState, action);

  // 3. 更新战斗状态
  battleState.history.push(actionResult);
  updateBattleState(battleState, actionResult);

  // 4. 检查战斗结束
  if (checkBattleEnd(battleState)) {
    battleState.result = calculateBattleResult(battleState);
  }

  return battleState;
}
```

### 3. 技能执行

```typescript
function executeSkill(
  battleState: BattleState,
  skill: BattleSkill,
  caster: BattleUnit,
  target: BattleUnit
): BattleActionResult {
  // 1. 检查技能条件
  if (!canUseSkill(caster, skill)) {
    throw new Error('Cannot use skill');
  }

  // 2. 消耗资源
  consumeSkillCost(caster, skill);

  // 3. 计算效果
  const effects = calculateSkillEffects(skill, caster, target);

  // 4. 应用效果
  applyEffects(target, effects);

  // 5. 设置冷却
  setSkillCooldown(caster, skill);

  // 6. 生成描述文本
  const description = generateActionDescription(skill, caster, target, effects);

  return {
    actionType: 'skill',
    skillId: skill.id,
    result: effects,
    description
  };
}
```

---

## 🔧 实现计划

### Phase 1: 基础回合制框架
1. 重构 `battleService.ts`，实现回合制战斗流程
2. 实现战斗状态管理
3. 实现基础行动选择（攻击、防御）
4. 更新 `BattleModal.tsx` UI

### Phase 2: 技能系统
1. 设计技能数据结构
2. 实现功法技能配置
3. 实现技能执行逻辑
4. 实现技能冷却机制
5. 更新UI显示技能列表

### Phase 3: 丹药系统
1. 设计战斗丹药配置
2. 实现丹药使用逻辑
3. 实现丹药冷却机制
4. 更新UI显示丹药列表

### Phase 4: 法宝/武器技能
1. 为法宝/武器添加技能配置
2. 实现技能解锁机制
3. 整合到战斗系统

### Phase 5: 状态效果系统
1. 实现Buff/Debuff系统
2. 实现持续效果处理
3. 更新UI显示状态图标

### Phase 6: 优化和平衡
1. 技能伤害平衡调整
2. 战斗难度平衡
3. UI/UX优化
4. 战斗动画和反馈

---

## 📝 数据结构扩展

### types.ts 扩展

```typescript
// 战斗相关类型
export interface BattleState {
  id: string;
  round: number;
  turn: 'player' | 'enemy';
  player: BattleUnit;
  enemy: BattleUnit;
  history: BattleAction[];
  result?: BattleResult;
}

export interface BattleUnit {
  id: string;
  name: string;
  realm: RealmType;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  spirit: number;
  buffs: Buff[];
  debuffs: Debuff[];
  skills: BattleSkill[];
  cooldowns: Record<string, number>;
  mana?: number;
  energy?: number;
}

export interface BattleSkill {
  id: string;
  name: string;
  description: string;
  type: 'attack' | 'defense' | 'heal' | 'buff' | 'debuff' | 'special';
  source: 'cultivation_art' | 'artifact' | 'weapon' | 'potion' | 'innate';
  sourceId: string;
  effects: SkillEffect[];
  cost: {
    mana?: number;
    energy?: number;
    hp?: number;
  };
  cooldown: number;
  maxCooldown: number;
  conditions?: {
    minHp?: number;
    requireBuff?: string;
    requireDebuff?: string;
  };
  target: 'self' | 'enemy' | 'both';
  damage?: {
    base: number;
    multiplier: number;
    type: 'physical' | 'magical';
    critChance?: number;
    critMultiplier?: number;
  };
  heal?: {
    base: number;
    multiplier: number;
  };
}

// Item 扩展：添加技能配置
export interface Item {
  // ... 现有字段
  battleSkills?: BattleSkill[]; // 战斗技能（法宝/武器）
}
```

### constants.ts 扩展

```typescript
// 功法战斗技能配置
export const CULTIVATION_ART_BATTLE_SKILLS: Record<string, BattleSkill[]> = {
  // ...
};

// 法宝技能配置
export const ARTIFACT_BATTLE_SKILLS: Record<string, BattleSkill[]> = {
  // ...
};

// 武器技能配置
export const WEAPON_BATTLE_SKILLS: Record<string, BattleSkill[]> = {
  // ...
};

// 战斗可用丹药配置
export const BATTLE_POTIONS: Record<string, BattlePotion> = {
  // ...
};
```

---

## 🎯 设计原则

1. **策略性**: 通过技能组合、状态效果等提供丰富的战斗策略
2. **平衡性**: 确保不同技能、装备之间的平衡
3. **可扩展性**: 方便后续添加新的技能、状态效果等
4. **用户体验**: 清晰的UI、流畅的操作、及时的反馈
5. **性能**: 战斗计算高效，不影响游戏流畅度

---

## ❓ 待确认问题

1. **灵力系统**: 是否需要引入灵力值（MP）系统？还是使用冷却时间限制技能使用？
2. **技能数量**: 每个功法/法宝/武器应该有多少个技能？
3. **技能解锁**: 技能是否需要通过特定条件解锁（如境界、装备等级等）？
4. **战斗难度**: 回合制战斗后，是否需要调整敌人强度以保持挑战性？
5. **自动战斗**: 是否需要保留自动战斗选项（AI自动选择行动）？
6. **战斗时长**: 回合制战斗可能比自动战斗耗时更长，是否需要加速选项？

---

## 📚 参考

- 现有战斗系统: `services/battleService.ts`
- 功法系统: `constants.ts` - `CULTIVATION_ARTS`
- 物品系统: `types.ts` - `Item`
- 战斗UI: `components/BattleModal.tsx`

