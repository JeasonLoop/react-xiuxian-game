# 存档 JSON 格式说明文档

本文档详细说明了修仙游戏存档的 JSON 格式，包括所有字段的含义、类型、取值范围和示例。

## 📋 目录

- [存档结构概览](#存档结构概览)
- [顶层结构](#顶层结构)
- [玩家数据 (player)](#玩家数据-player)
- [日志数据 (logs)](#日志数据-logs)
- [完整示例](#完整示例)
- [注意事项](#注意事项)
- [常见问题](#常见问题)

---

## 存档结构概览

存档文件是一个 JSON 对象，包含以下顶层字段：

```json
{
  "player": { ... },    // 玩家数据对象
  "logs": [ ... ],      // 游戏日志数组
  "timestamp": 1234567890123  // 保存时间戳（毫秒）
}
```

---

## 顶层结构

### 字段说明

| 字段名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| `player` | `object` | ✅ | 玩家数据对象，包含所有角色信息 |
| `logs` | `array` | ✅ | 游戏日志数组，记录游戏过程中的事件 |
| `timestamp` | `number` | ❌ | 存档保存时间戳（Unix 时间戳，毫秒） |

---

## 玩家数据 (player)

### PlayerStats 接口

玩家数据对象包含角色的所有状态信息。

#### 基本信息

| 字段名 | 类型 | 必需 | 说明 | 示例值 |
|--------|------|------|------|--------|
| `name` | `string` | ✅ | 玩家角色名称 | `"张三"` |
| `realm` | `string` | ✅ | 当前境界 | `"炼气期"` |
| `realmLevel` | `number` | ✅ | 境界等级（1-9） | `5` |
| `exp` | `number` | ✅ | 当前经验值 | `1250` |
| `maxExp` | `number` | ✅ | 当前境界所需最大经验值 | `2000` |

#### 境界类型 (realm)

可能的取值（按从低到高排序）：

- `"炼气期"` - 初始境界
- `"筑基期"` - 第二境界
- `"金丹期"` - 第三境界
- `"元婴期"` - 第四境界
- `"化神期"` - 第五境界
- `"炼虚期"` - 第六境界
- `"渡劫飞升"` - 最高境界

#### 属性数据

| 字段名 | 类型 | 必需 | 说明 | 示例值 |
|--------|------|------|------|--------|
| `hp` | `number` | ✅ | 当前生命值 | `450` |
| `maxHp` | `number` | ✅ | 最大生命值 | `500` |
| `attack` | `number` | ✅ | 攻击力 | `120` |
| `defense` | `number` | ✅ | 防御力 | `80` |
| `spirit` | `number` | ✅ | 神识（影响法术威力和感知能力） | `60` |
| `physique` | `number` | ✅ | 体魄（影响气血上限和物理抗性） | `90` |
| `speed` | `number` | ✅ | 速度（影响行动顺序和闪避） | `50` |
| `luck` | `number` | ✅ | 幸运值（影响奇遇和掉落） | `15` |

#### 资源数据

| 字段名 | 类型 | 必需 | 说明 | 示例值 |
|--------|------|------|------|--------|
| `spiritStones` | `number` | ✅ | 灵石数量 | `5000` |
| `lotteryTickets` | `number` | ✅ | 抽奖券数量 | `3` |
| `lotteryCount` | `number` | ✅ | 累计抽奖次数（用于保底） | `25` |
| `attributePoints` | `number` | ✅ | 可分配属性点 | `10` |

#### 物品和装备

| 字段名 | 类型 | 必需 | 说明 | 示例值 |
|--------|------|------|------|--------|
| `inventory` | `Item[]` | ✅ | 背包物品数组 | 见下方 Item 说明 |
| `equippedItems` | `object` | ✅ | 已装备物品映射 | `{ "武器": "item-id-123" }` |

##### Item 对象结构

```typescript
{
  id: string;                    // 物品唯一ID
  name: string;                  // 物品名称
  type: string;                  // 物品类型
  description: string;           // 物品描述
  quantity: number;              // 数量
  rarity?: string;               // 稀有度（可选）
  level?: number;                // 强化等级（可选，默认0）
  isEquippable?: boolean;        // 是否可装备（可选）
  equipmentSlot?: string;        // 装备槽位（可选）
  isNatal?: boolean;             // 是否为本命法宝（可选）
  effect?: {                     // 物品效果（可选）
    hp?: number;
    exp?: number;
    attack?: number;
    defense?: number;
    spirit?: number;
    physique?: number;
    speed?: number;
  };
  permanentEffect?: {            // 永久效果（可选）
    attack?: number;
    defense?: number;
    spirit?: number;
    physique?: number;
    speed?: number;
    maxHp?: number;
  };
}
```

**物品类型 (type) 可能的值：**
- `"草药"` - 草药类物品
- `"丹药"` - 丹药类物品
- `"材料"` - 材料类物品
- `"法宝"` - 法宝类物品
- `"武器"` - 武器类物品
- `"护甲"` - 护甲类物品
- `"首饰"` - 首饰类物品
- `"戒指"` - 戒指类物品

**稀有度 (rarity) 可能的值：**
- `"普通"` - 普通品质
- `"稀有"` - 稀有品质
- `"传说"` - 传说品质
- `"仙品"` - 仙品品质

**装备槽位 (equipmentSlot) 可能的值：**
- `"头部"` - 头部装备
- `"肩部"` - 肩部装备
- `"胸甲"` - 胸甲装备
- `"手套"` - 手套装备
- `"裤腿"` - 裤腿装备
- `"鞋子"` - 鞋子装备
- `"戒指1"` 到 `"戒指4"` - 戒指槽位（最多4个）
- `"首饰1"` 到 `"首饰2"` - 首饰槽位（最多2个）
- `"法宝1"` 到 `"法宝2"` - 法宝槽位（最多2个）
- `"武器"` - 武器槽位

**equippedItems 结构示例：**
```json
{
  "武器": "item-sword-001",
  "头部": "item-helmet-002",
  "戒指1": "item-ring-003"
}
```

#### 修炼系统

| 字段名 | 类型 | 必需 | 说明 | 示例值 |
|--------|------|------|------|--------|
| `cultivationArts` | `string[]` | ✅ | 已学习的功法ID数组 | `["art-basic-breath", "art-iron-skin"]` |
| `activeArtId` | `string \| null` | ✅ | 当前激活的心法ID | `"art-basic-breath"` 或 `null` |

#### 宗门系统

| 字段名 | 类型 | 必需 | 说明 | 示例值 |
|--------|------|------|------|--------|
| `sectId` | `string \| null` | ✅ | 所属宗门ID | `"sect-cloud-spirit"` 或 `null` |
| `sectRank` | `string` | ✅ | 宗门职位 | `"内门弟子"` |
| `sectContribution` | `number` | ✅ | 宗门贡献值 | `1500` |

**宗门职位 (sectRank) 可能的值：**
- `"外门弟子"` - 最低职位
- `"内门弟子"` - 第二级职位
- `"真传弟子"` - 第三级职位
- `"长老"` - 最高职位

#### 角色系统

| 字段名 | 类型 | 必需 | 说明 | 示例值 |
|--------|------|------|------|--------|
| `talentId` | `string \| null` | ✅ | 天赋ID（游戏开始时随机生成，之后不可修改） | `"talent-iron-will"` 或 `null` |
| `titleId` | `string \| null` | ✅ | 称号ID | `"title-immortal-killer"` 或 `null` |

#### 成就系统

| 字段名 | 类型 | 必需 | 说明 | 示例值 |
|--------|------|------|------|--------|
| `achievements` | `string[]` | ✅ | 已完成的成就ID数组 | `["ach-realm-1", "ach-realm-2"]` |
| `viewedAchievements` | `string[]` | ✅ | 已查看过的成就ID数组（用于角标显示） | `["ach-realm-1"]` |

#### 灵宠系统

| 字段名 | 类型 | 必需 | 说明 | 示例值 |
|--------|------|------|------|--------|
| `pets` | `Pet[]` | ✅ | 拥有的灵宠数组 | 见下方 Pet 说明 |
| `activePetId` | `string \| null` | ✅ | 当前激活的灵宠ID | `"pet-001"` 或 `null` |

##### Pet 对象结构

```typescript
{
  id: string;                    // 灵宠唯一ID
  name: string;                  // 灵宠名称
  species: string;               // 灵宠种类
  level: number;                 // 等级
  exp: number;                   // 当前经验值
  maxExp: number;                // 升级所需经验值
  rarity: string;                // 稀有度（"普通" | "稀有" | "传说" | "仙品"）
  stats: {                       // 属性
    attack: number;              // 攻击力
    defense: number;             // 防御力
    hp: number;                  // 生命值
    speed: number;               // 速度
  };
  skills: PetSkill[];            // 技能数组
  evolutionStage: number;        // 进化阶段（0-2）
  affection: number;             // 亲密度（0-100）
}
```

##### PetSkill 对象结构

```typescript
{
  id: string;                    // 技能ID
  name: string;                  // 技能名称
  description: string;           // 技能描述
  type: string;                  // 技能类型（"attack" | "defense" | "support" | "passive"）
  effect: {                      // 技能效果
    damage?: number;             // 伤害值（攻击技能）
    heal?: number;               // 治疗值（治疗技能）
    buff?: {                     // 增益效果
      attack?: number;
      defense?: number;
      hp?: number;
    };
  };
  cooldown?: number;             // 冷却时间（可选）
}
```

#### 传承系统

| 字段名 | 类型 | 必需 | 说明 | 示例值 |
|--------|------|------|------|--------|
| `inheritanceLevel` | `number` | ✅ | 传承等级（0-4，每次传承可突破1-4个境界） | `2` |

#### 每日任务系统

| 字段名 | 类型 | 必需 | 说明 | 示例值 |
|--------|------|------|------|--------|
| `dailyTaskCount` | `number` | ✅ | 今日已完成瞬时任务次数 | `3` |
| `lastTaskResetDate` | `string` | ✅ | 上次重置任务计数的日期（YYYY-MM-DD格式） | `"2024-01-15"` |

#### 本命法宝系统

| 字段名 | 类型 | 必需 | 说明 | 示例值 |
|--------|------|------|------|--------|
| `natalArtifactId` | `string \| null` | ✅ | 本命法宝ID | `"artifact-natal-001"` 或 `null` |

---

## 日志数据 (logs)

日志数组包含游戏过程中的所有事件记录。

### LogEntry 接口

```typescript
{
  id: string;                    // 日志条目唯一ID
  text: string;                  // 日志文本内容
  type: string;                  // 日志类型
  timestamp: number;             // 时间戳（毫秒）
}
```

#### 字段说明

| 字段名 | 类型 | 必需 | 说明 | 示例值 |
|--------|------|------|------|--------|
| `id` | `string` | ✅ | 日志条目唯一ID | `"log-1234567890"` |
| `text` | `string` | ✅ | 日志文本内容 | `"你在历练中遇到了一个神秘洞穴..."` |
| `type` | `string` | ✅ | 日志类型 | `"normal"` |
| `timestamp` | `number` | ✅ | 时间戳（Unix 时间戳，毫秒） | `1705123456789` |

#### 日志类型 (type) 可能的值

- `"normal"` - 普通日志（白色）
- `"gain"` - 获得类日志（绿色，如获得物品、经验等）
- `"danger"` - 危险类日志（红色，如战斗、陷阱等）
- `"special"` - 特殊类日志（金色，如突破、重要事件等）

---

## 完整示例

以下是一个完整的存档 JSON 示例：

```json
{
  "player": {
    "name": "张三",
    "realm": "筑基期",
    "realmLevel": 5,
    "exp": 1250,
    "maxExp": 2000,
    "hp": 450,
    "maxHp": 500,
    "attack": 120,
    "defense": 80,
    "spirit": 60,
    "physique": 90,
    "speed": 50,
    "luck": 15,
    "spiritStones": 5000,
    "lotteryTickets": 3,
    "lotteryCount": 25,
    "attributePoints": 10,
    "inventory": [
      {
        "id": "item-herb-001",
        "name": "回血草",
        "type": "草药",
        "description": "可以恢复少量生命值的草药",
        "quantity": 5,
        "rarity": "普通",
        "effect": {
          "hp": 50
        }
      },
      {
        "id": "item-sword-001",
        "name": "精铁剑",
        "type": "武器",
        "description": "一把普通的精铁剑",
        "quantity": 1,
        "rarity": "普通",
        "level": 2,
        "isEquippable": true,
        "equipmentSlot": "武器",
        "effect": {
          "attack": 20
        }
      }
    ],
    "equippedItems": {
      "武器": "item-sword-001"
    },
    "cultivationArts": [
      "art-basic-breath",
      "art-iron-skin"
    ],
    "activeArtId": "art-basic-breath",
    "sectId": "sect-cloud-spirit",
    "sectRank": "内门弟子",
    "sectContribution": 1500,
    "talentId": "talent-iron-will",
    "titleId": null,
    "achievements": [
      "ach-realm-1",
      "ach-realm-2"
    ],
    "viewedAchievements": [
      "ach-realm-1"
    ],
    "pets": [
      {
        "id": "pet-001",
        "name": "小狐狸",
        "species": "灵狐",
        "level": 5,
        "exp": 250,
        "maxExp": 500,
        "rarity": "稀有",
        "stats": {
          "attack": 30,
          "defense": 20,
          "hp": 100,
          "speed": 40
        },
        "skills": [
          {
            "id": "skill-fire-ball",
            "name": "火球术",
            "description": "发射一个火球攻击敌人",
            "type": "attack",
            "effect": {
              "damage": 50
            },
            "cooldown": 3
          }
        ],
        "evolutionStage": 0,
        "affection": 75
      }
    ],
    "activePetId": "pet-001",
    "inheritanceLevel": 2,
    "dailyTaskCount": 3,
    "lastTaskResetDate": "2024-01-15",
    "natalArtifactId": null
  },
  "logs": [
    {
      "id": "log-001",
      "text": "欢迎来到修仙世界。你的长生之路就此开始。",
      "type": "special",
      "timestamp": 1705123456789
    },
    {
      "id": "log-002",
      "text": "你天生拥有【钢铁意志】天赋。你的意志力远超常人，在修炼时更加专注。",
      "type": "special",
      "timestamp": 1705123456790
    },
    {
      "id": "log-003",
      "text": "你在历练中遇到了一个神秘洞穴，发现了一株回血草。",
      "type": "gain",
      "timestamp": 1705123456791
    }
  ],
  "timestamp": 1705123456789
}
```

---

## 注意事项

### 1. 数据完整性

- **必需字段**：`player` 和 `logs` 是必需字段，缺少这些字段会导致导入失败
- **字段类型**：确保所有字段的类型正确，例如 `realmLevel` 必须是数字而不是字符串
- **数组类型**：`inventory`、`logs`、`pets` 等必须是数组，即使为空也要使用 `[]`

### 2. 数据有效性

- **境界等级**：`realmLevel` 的取值范围是 1-9
- **属性值**：所有属性值（hp、attack、defense 等）应该是非负数
- **经验值**：`exp` 应该小于等于 `maxExp`
- **生命值**：`hp` 应该小于等于 `maxHp`
- **日期格式**：`lastTaskResetDate` 必须使用 `YYYY-MM-DD` 格式

### 3. ID 唯一性

- 所有 `id` 字段（物品ID、灵宠ID、日志ID等）应该是唯一的字符串
- 建议使用有意义的ID格式，如 `"item-sword-001"` 而不是随机字符串

### 4. 装备系统

- `equippedItems` 中的值必须是 `inventory` 中存在的物品ID
- 如果物品被装备，确保 `isEquippable` 为 `true`
- 确保装备槽位名称与 `equipmentSlot` 匹配

### 5. 修炼系统

- `cultivationArts` 中的ID必须是游戏中存在的功法ID
- `activeArtId` 必须是 `cultivationArts` 中的一个ID，或者是 `null`

### 6. 宗门系统

- `sectId` 必须是游戏中存在的宗门ID，或者是 `null`
- `sectRank` 必须是有效的宗门职位值

### 7. 灵宠系统

- `activePetId` 必须是 `pets` 数组中某个灵宠的ID，或者是 `null`
- 灵宠的 `affection` 值应该在 0-100 之间
- 灵宠的 `evolutionStage` 值应该在 0-2 之间

### 8. 版本兼容性

- 如果存档来自旧版本，某些新字段可能缺失
- 游戏会自动为缺失的字段设置默认值：
  - `dailyTaskCount`: `0`
  - `lastTaskResetDate`: 当前日期
  - `viewedAchievements`: `[]`
  - `natalArtifactId`: `null`

### 9. 文件格式

- 存档文件可以是 `.json` 或 `.txt` 格式
- 文件内容必须是有效的 JSON 格式
- 建议使用 UTF-8 编码保存文件

### 10. 备份建议

- 在导入新存档前，建议先导出当前存档作为备份
- 定期备份存档文件，避免数据丢失
- 不要手动修改存档文件，除非你完全了解所有字段的含义

---

## 常见问题

### Q1: 导入存档后游戏无法正常加载？

**A:** 检查以下几点：
1. 确保 JSON 格式正确（可以使用在线 JSON 验证工具检查）
2. 确保 `player` 和 `logs` 字段存在
3. 检查必需字段是否都有值
4. 查看浏览器控制台的错误信息

### Q2: 如何修改存档中的属性值？

**A:** 可以直接编辑 JSON 文件中的数值，但需要注意：
- 确保数值类型正确（数字不要加引号）
- 确保数值在合理范围内
- 修改后验证 JSON 格式是否正确

### Q3: 可以添加不存在的物品吗？

**A:** 理论上可以，但建议只使用游戏中存在的物品ID和类型，否则可能导致游戏异常。

### Q4: 存档文件大小有限制吗？

**A:** 浏览器 localStorage 通常有 5-10MB 的限制，但存档文件一般不会超过这个限制。如果日志过多，可以考虑清理旧日志。

### Q5: 如何重置每日任务计数？

**A:** 修改 `dailyTaskCount` 为 `0`，并修改 `lastTaskResetDate` 为当前日期（格式：`YYYY-MM-DD`）。

### Q6: 如何修改境界？

**A:** 修改 `realm` 字段为目标境界（如 `"金丹期"`），并相应调整 `realmLevel`（1-9）、`exp` 和 `maxExp` 的值。

### Q7: 导入存档后页面自动刷新是正常的吗？

**A:** 是的，这是正常行为。导入存档后页面会自动刷新以加载新数据。

### Q8: 可以同时拥有多个存档吗？

**A:** 游戏使用 localStorage 存储，同一浏览器只能有一个存档。如果需要多个存档，可以：
- 导出存档文件保存到本地
- 使用不同的浏览器或隐私模式
- 使用浏览器扩展管理多个 localStorage

---

## 技术支持

如果遇到问题，可以：
1. 查看浏览器控制台的错误信息
2. 检查存档 JSON 格式是否正确
3. 参考本文档验证字段是否正确
4. 在 GitHub 仓库提交 Issue

---

**最后更新**: 2024-01-15
**文档版本**: 1.0.0

