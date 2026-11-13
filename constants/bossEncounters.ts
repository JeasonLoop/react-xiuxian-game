/**
 * 秘境专属机制 BOSS 常量（M4-2）
 * 对应三档高阶秘境：劫灰古战场（化神）/ 天机残阁（合道）/ 镜中仙宫（长生）。
 * BOSS 通道独立于精英系统：isBoss 不与 isElite 叠加。
 * 阶段机制由 services/battle/bossPhases.ts 引擎按 bossPhases 配置驱动。
 */

import { BattleSkill, Buff, ItemType, ItemRarity, RealmType } from '../types';

/** BOSS 阶段配置：血量低于 hpThreshold 时进入该阶段（阶段编号从 1 起） */
export interface BossPhaseConfig {
  phase: number;
  /** 进入该阶段的血量阈值（当前血量占比 < 阈值时切换） */
  hpThreshold: number;
  /** 阶段切换时的醒目战斗日志 */
  entryLog: string;
  /** 切换时对 BOSS 属性施加的一次性乘区 */
  statMultipliers?: { attack?: number; defense?: number; speed?: number };
  /** 切换时推送到 BOSS 身上的增益（duration -1 表示战斗内永久） */
  entryBuffs?: Buff[];
  /** 切换时 BOSS 防御归零（玄枢「自毁程序」） */
  zeroDefense?: boolean;
  /** 特殊机制标记 */
  special?: 'shield' | 'copyPlayerBuffs' | 'selfDestruct' | 'mirrorSacrifice';
  /** shield：护盾值占 BOSS 最大气血比例 */
  shieldRatio?: number;
  /** selfDestruct：力竭倒计时（回合数），归零时 BOSS 力竭死亡 */
  selfDestructTurns?: number;
  /** mirrorSacrifice：每回合自损最大气血比例 */
  selfDamageRatio?: number;
}

/** BOSS 击杀后的专属额外掉落（直接按名称/品阶发放） */
export interface BossBonusLootItem {
  name: string;
  type: ItemType;
  rarity: ItemRarity;
  description: string;
}

/** 秘境专属机制 BOSS 定义 */
export interface BossEncounter {
  id: string;
  name: string;
  title: string;
  realm: RealmType;
  /** 所属专属秘境 ID（对应 SECRET_REALMS 的 id） */
  secretRealmId: string;
  description: string;
  /** 镜像 BOSS：属性=玩家总属性×statRatios，技能从玩家功法技能池抽取 */
  isMirror?: boolean;
  /** 属性 = 玩家总属性 × 对应比例（镜像 BOSS 亦如此，不走普通敌人推算） */
  statRatios: { attack: number; defense: number; maxHp: number; speed: number; spirit: number };
  /** 全阶段可用技能 */
  specialSkills: BattleSkill[];
  /** 各阶段解锁的技能池（阶段切换时追加到 BOSS 技能列表） */
  phaseSkills: Record<number, BattleSkill[]>;
  /** 阶段配置（含第 1 阶段的初始机制，进入战斗时由引擎应用） */
  bossPhases: BossPhaseConfig[];
  /** 击杀额外掉落 */
  bonusLoot: BossBonusLootItem[];
}

/** BOSS 奖励倍区：击杀后修为/灵石/掉落收益 ×3（与精英 ELITE_REWARD_MULTIPLIER 同思路） */
export const BOSS_REWARD_MULTIPLIER = 3;

/** 专属秘境战斗遭遇 BOSS 的概率（约每 3-4 战一遇） */
export const SECRET_REALM_BOSS_CHANCE = 0.3;

/** 通用增益构造辅助：永久攻击/速度/防御类 buff */
const bossBuff = (id: string, name: string, type: Buff['type'], value: number, description: string): Buff => ({
  id,
  name,
  type,
  value,
  duration: -1,
  source: 'boss_phase',
  description,
});

// ==================== 化神 · 劫灰古战场 BOSS ====================

const JIEHUI_COLOSSUS: BossEncounter = {
  id: 'sr_boss_jiehui_colossus',
  name: '劫灰巨像',
  title: '劫灰古战场的',
  realm: RealmType.SpiritSevering,
  secretRealmId: 'realm-jiehui-battlefield',
  description: '上古劫火熄灭后，亿万战魂残躯与劫灰凝成的庞然巨物，仍在执行着毁灭的敕令。',
  statRatios: { attack: 0.82, defense: 0.9, maxHp: 1.52, speed: 0.9, spirit: 0.85 },
  specialSkills: [
    {
      id: 'sr_boss_jiehui_smash',
      name: '劫灰重压',
      description: '巨像抬臂轰落，劫灰如山倾轧而下。',
      type: 'attack',
      source: 'innate',
      sourceId: 'sr_boss_jiehui_colossus',
      effects: [],
      cost: { mana: 30 },
      cooldown: 0,
      maxCooldown: 2,
      target: 'enemy',
      damage: { base: 0, multiplier: 1.25, type: 'physical', critChance: 0.1 },
    },
    {
      id: 'sr_boss_jiehui_ember',
      name: '余烬喷薄',
      description: '躯体裂缝中喷出劫火余烬，灼烧敌身。',
      type: 'attack',
      source: 'innate',
      sourceId: 'sr_boss_jiehui_colossus',
      effects: [
        {
          type: 'debuff',
          target: 'enemy',
          debuff: {
            id: 'sr_boss_jiehui_burn',
            name: '劫灰余烬',
            type: 'burn',
            value: -0.04,
            duration: 3,
            source: 'sr_boss_jiehui_colossus',
            description: '劫火余烬附着周身，每回合灼蚀气血。',
          },
        },
      ],
      cost: { mana: 40 },
      cooldown: 0,
      maxCooldown: 3,
      target: 'enemy',
      damage: { base: 0, multiplier: 1.0, type: 'magical' },
    },
  ],
  phaseSkills: {
    2: [
      {
        id: 'sr_boss_jiehui_prairie',
        name: '劫火燎原',
        description: '第二形态·劫火焚世：劫火化作燎原之势，焚尽一切生机。',
        type: 'attack',
        source: 'innate',
        sourceId: 'sr_boss_jiehui_colossus',
        effects: [
          {
            type: 'debuff',
            target: 'enemy',
            debuff: {
              id: 'sr_boss_jiehui_prairie_burn',
              name: '劫火焚身',
              type: 'burn',
              value: -0.06,
              duration: 3,
              source: 'sr_boss_jiehui_colossus',
              description: '劫火缠身，每回合灼蚀大量气血。',
            },
          },
        ],
        cost: { mana: 55 },
        cooldown: 0,
        maxCooldown: 3,
        target: 'enemy',
        damage: { base: 0, multiplier: 1.5, type: 'physical', critChance: 0.15 },
      },
    ],
  },
  bossPhases: [
    {
      phase: 1,
      hpThreshold: 1.01,
      entryLog: '【劫灰巨像】自劫灰深处苏醒，缓缓抬起了巨大的臂膀！',
    },
    {
      phase: 2,
      hpThreshold: 0.7,
      entryLog: '【劫灰巨像】进入第二形态：劫火焚世！躯体裂缝中喷涌出不灭劫火！',
      entryBuffs: [bossBuff('sr_boss_jiehui_p2_buff', '劫火焚世', 'attack', 0.25, '劫火焚世：攻击力提升25%。')],
    },
    {
      phase: 3,
      hpThreshold: 0.35,
      entryLog: '【劫灰巨像】进入最终形态：狂暴！残存的战魂在劫灰中嘶吼咆哮！',
      statMultipliers: { attack: 1.3, speed: 1.2 },
    },
  ],
  bonusLoot: [
    { name: '劫灰战铠碎片', type: ItemType.Material, rarity: '传说', description: '劫灰巨像崩解后遗留的战铠残片，蕴含上古劫火之力。' },
    { name: '化神劫灰髓', type: ItemType.Material, rarity: '仙品', description: '化神修士淬炼神魂所需的至纯劫灰之髓。' },
  ],
};

// ==================== 合道 · 天机残阁 BOSS ====================

const XUANSHU_PUPPET: BossEncounter = {
  id: 'sr_boss_xuanshu',
  name: '天机傀儡·玄枢',
  title: '天机残阁的',
  realm: RealmType.DaoCombining,
  secretRealmId: 'realm-tianji-pavilion',
  description: '天机阁倾覆时留下的至强机关造物，以天机为枢、雷法为脉，至今仍在运转。',
  statRatios: { attack: 0.95, defense: 1.05, maxHp: 1.35, speed: 0.95, spirit: 0.95 },
  specialSkills: [
    {
      id: 'sr_boss_xuanshu_slash',
      name: '机枢连斩',
      description: '千机枢轮连转，剑刃如暴雨般斩落。',
      type: 'attack',
      source: 'innate',
      sourceId: 'sr_boss_xuanshu',
      effects: [],
      cost: { mana: 30 },
      cooldown: 0,
      maxCooldown: 2,
      target: 'enemy',
      damage: { base: 0, multiplier: 1.2, type: 'physical', critChance: 0.12 },
    },
    {
      id: 'sr_boss_xuanshu_chain',
      name: '天机锁链',
      description: '无形锁链缠住敌身，封锁其气血运转。',
      type: 'attack',
      source: 'innate',
      sourceId: 'sr_boss_xuanshu',
      effects: [
        {
          type: 'debuff',
          target: 'enemy',
          debuff: {
            id: 'sr_boss_xuanshu_chain_debuff',
            name: '天机锁链',
            type: 'weakness',
            value: -0.15,
            duration: 3,
            source: 'sr_boss_xuanshu',
            description: '被天机锁链缠住，攻击力下降15%。',
          },
        },
      ],
      cost: { mana: 40 },
      cooldown: 0,
      maxCooldown: 3,
      target: 'enemy',
      damage: { base: 0, multiplier: 0.9, type: 'magical' },
    },
  ],
  phaseSkills: {
    2: [
      {
        id: 'sr_boss_xuanshu_thunder',
        name: '九霄神雷',
        description: '第二形态·过载模式：雷脉过载运转，引九霄神雷轰落。',
        type: 'attack',
        source: 'innate',
        sourceId: 'sr_boss_xuanshu',
        effects: [],
        cost: { mana: 55 },
        cooldown: 0,
        maxCooldown: 3,
        target: 'enemy',
        damage: { base: 0, multiplier: 1.5, type: 'magical', critChance: 0.2, critMultiplier: 1.8 },
      },
    ],
    3: [
      {
        id: 'sr_boss_xuanshu_annihilation',
        name: '自毁·湮灭脉冲',
        description: '第三形态·自毁程序：以自毁为代价，释放湮灭一切的终末一击。',
        type: 'attack',
        source: 'innate',
        sourceId: 'sr_boss_xuanshu',
        effects: [],
        cost: { mana: 60 },
        cooldown: 0,
        maxCooldown: 2,
        target: 'enemy',
        damage: { base: 0, multiplier: 1.8, type: 'physical', critChance: 0.2 },
      },
    ],
  },
  bossPhases: [
    {
      phase: 1,
      hpThreshold: 1.01,
      entryLog: '【天机傀儡·玄枢】中枢亮起，展开天机护界！',
      special: 'shield',
      shieldRatio: 0.2,
    },
    {
      phase: 2,
      hpThreshold: 0.6,
      entryLog: '【天机傀儡·玄枢】进入第二形态：过载模式！雷脉轰鸣，机枢转速暴涨！',
      statMultipliers: { speed: 1.25 },
      entryBuffs: [bossBuff('sr_boss_xuanshu_p2_buff', '过载模式', 'attack', 0.15, '过载模式：攻击力提升15%。')],
    },
    {
      phase: 3,
      hpThreshold: 0.3,
      entryLog: '【天机傀儡·玄枢】进入最终形态：自毁程序！防御机壳尽数弹开，攻击三回合后机枢力竭！',
      statMultipliers: { attack: 1.6 },
      zeroDefense: true,
      special: 'selfDestruct',
      selfDestructTurns: 3,
    },
  ],
  bonusLoot: [
    { name: '天机核心·玄枢', type: ItemType.Artifact, rarity: '传说', description: '天机傀儡的中枢造物，蕴藏合道机关至理。' },
    { name: '合道天机符', type: ItemType.Material, rarity: '仙品', description: '记录天机运转之理的符诏，合道修士参悟所需的至宝。' },
  ],
};

// ==================== 长生 · 镜中仙宫 BOSS ====================

const MIRROR_SELF: BossEncounter = {
  id: 'sr_boss_mirror_self',
  name: '前世镜像·张三',
  title: '镜中仙宫的',
  realm: RealmType.LongevityRealm,
  secretRealmId: 'realm-mirror-palace',
  description: '镜中仙宫深处映照出的「前世之你」，复制了今生的一切道法神通，唯有胜过昨日的自己，方能窥见长生真意。',
  isMirror: true,
  statRatios: { attack: 1.1, defense: 1.1, maxHp: 1.1, speed: 1.1, spirit: 1.1 },
  specialSkills: [],
  phaseSkills: {},
  bossPhases: [
    {
      phase: 1,
      hpThreshold: 1.01,
      entryLog: '【前世镜像】自镜光中走出，一举一动与你如出一辙！',
    },
    {
      phase: 2,
      hpThreshold: 0.5,
      entryLog: '【前世镜像】进入第二形态：道镜映照！镜像复制了你此刻的全部状态！',
      special: 'copyPlayerBuffs',
    },
    {
      phase: 3,
      hpThreshold: 0.25,
      entryLog: '【前世镜像】进入最终形态：道消身殒！镜像焚烧自身道基，攻伐暴涨，但每一回合都在崩解！',
      entryBuffs: [bossBuff('sr_boss_mirror_p3_buff', '道消身殒', 'attack', 0.5, '道消身殒：伤害提升50%，但自身持续崩解。')],
      special: 'mirrorSacrifice',
      selfDamageRatio: 0.03,
    },
  ],
  bonusLoot: [
    { name: '长生规则结晶', type: ItemType.Material, rarity: '仙品', description: '镜中仙宫凝结的规则之力结晶，长生修士参悟天道的关键。' },
    { name: '前世记忆残片', type: ItemType.Material, rarity: '传说', description: '映照前世今生的记忆残片，或许藏着轮回的秘密。' },
  ],
};

/** 全部秘境专属机制 BOSS（按 BOSS ID 索引） */
export const SECRET_REALM_BOSSES: Record<string, BossEncounter> = {
  [JIEHUI_COLOSSUS.id]: JIEHUI_COLOSSUS,
  [XUANSHU_PUPPET.id]: XUANSHU_PUPPET,
  [MIRROR_SELF.id]: MIRROR_SELF,
};

/** 按秘境 ID 索引的专属 BOSS（秘境战斗链路据此判定 BOSS 遭遇） */
export const SECRET_REALM_BOSS_BY_REALM: Record<string, BossEncounter> = {
  [JIEHUI_COLOSSUS.secretRealmId]: JIEHUI_COLOSSUS,
  [XUANSHU_PUPPET.secretRealmId]: XUANSHU_PUPPET,
  [MIRROR_SELF.secretRealmId]: MIRROR_SELF,
};
