import {
  PlayerStats,
  AdventureResult,
  AdventureType,
  RealmType,
} from '../types';
import { REALM_ORDER } from '../constants';
import {
  getAIConfig,
  validateAIConfig,
  getAIConfigInfo,
} from '../config/aiConfig';

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

// 获取 AI 配置
const aiConfig = getAIConfig();
const API_URL = aiConfig.apiUrl;
const API_MODEL = aiConfig.model;
const API_KEY = aiConfig.apiKey;

// 验证配置
const validation = validateAIConfig(aiConfig);
if (!validation.valid) {
  console.warn(`⚠️ AI 配置无效: ${validation.error}`);
  console.info(getAIConfigInfo());
}

const stripCodeFence = (text: string): string => {
  let output = text.trim();

  // 移除代码块标记
  if (output.startsWith('```')) {
    output = output
      .replace(/^```(?:json|JSON)?/i, '')
      .replace(/```$/i, '')
      .trim();
  }
  if (output.toLowerCase().startsWith('json')) {
    output = output.slice(4).trim();
  }

  // 移除可能的前置说明文字（如"根据你的要求"、"我做了调整"等）
  // 查找第一个 { 或 [ 的位置，移除之前的所有内容
  const jsonStart = output.search(/[\{\[]/);
  if (jsonStart > 0) {
    output = output.slice(jsonStart);
  }

  // 移除可能的后置说明文字
  // 查找最后一个 } 或 ] 的位置，移除之后的所有内容
  const lastBrace = Math.max(output.lastIndexOf('}'), output.lastIndexOf(']'));
  if (lastBrace > 0 && lastBrace < output.length - 1) {
    // 检查后面是否还有有效的JSON内容，如果没有则截断
    const afterBrace = output.slice(lastBrace + 1).trim();
    if (afterBrace && !afterBrace.match(/^[,}\]]/)) {
      // 如果后面有非JSON字符，截断
      output = output.slice(0, lastBrace + 1);
    }
  }

  return output.trim();
};

// 清理JSON中的无效格式（如 +8 应该改为 8）
const cleanJsonString = (jsonString: string): string => {
  // 修复数字前的 + 号（如 "spirit": +8 -> "spirit": 8）
  // 匹配模式：": +数字 或 ":+数字
  let cleaned = jsonString.replace(/:\s*\+(\d+)/g, ': $1');

  // 修复其他可能的JSON格式问题
  // 移除数字前的多个 + 号
  cleaned = cleaned.replace(/:\s*\+\+(\d+)/g, ': $1');

  // 修复字符串值中的 + 号（如果AI错误地在字符串中加了+）
  // 但要注意不要破坏正常的字符串内容

  return cleaned;
};

const parseMessageContent = (content: unknown): string => {
  if (typeof content === 'string') {
    return stripCodeFence(content);
  }
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') return part;
        if (typeof part === 'object' && part !== null && 'text' in part) {
          return (part as { text?: string }).text || '';
        }
        return '';
      })
      .join('');
  }
  return '';
};

const requestSpark = async (messages: ChatMessage[], temperature = 0.8) => {
  if (!API_KEY) {
    throw new Error('AI API key is missing');
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: API_MODEL,
      messages,
      temperature,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Spark API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const content = parseMessageContent(data?.choices?.[0]?.message?.content);

  if (!content) {
    throw new Error('Spark API returned empty content');
  }

  return content;
};

export const generateAdventureEvent = async (
  player: PlayerStats,
  adventureType: AdventureType = 'normal',
  riskLevel?: '低' | '中' | '高' | '极度危险'
): Promise<AdventureResult> => {
  if (!API_KEY) {
    return {
      story: '你静心打坐，四周一片寂静。（API Key 缺失，AI 功能已禁用）',
      hpChange: 5,
      expChange: 10,
      spiritStonesChange: 0,
      eventColor: 'normal',
    };
  }

  try {
    let typeInstructions = '';

    // 根据境界调整事件类型和奖励
    const realmIndex = REALM_ORDER.indexOf(player.realm);
    const realmMultiplier =
      1 + realmIndex * 0.3 + (player.realmLevel - 1) * 0.1;

    switch (adventureType) {
      case 'lucky':
        typeInstructions = `
          这是一次【大机缘】事件！玩家运气爆棚。
          当前境界：${player.realm} (第 ${player.realmLevel} 层)

          请生成一个极其罕见的正面事件，事件类型应该与玩家境界相匹配：
          - 低境界（炼气、筑基）：可能发现古修士洞府、获得稀有功法、遇到高人指点
          - 中境界（金丹、元婴）：可能发现上古遗迹、获得传说法宝、顿悟大道
          - 高境界（化神及以上）：可能发现仙府、获得仙品至宝、领悟无上大道

          事件颜色应为 "special"。
          物品稀有度：低境界为"稀有"或"传说"，高境界可为"传说"或"仙品"。
          收益应当非常丰厚，修为奖励：${Math.floor(100 * realmMultiplier)}-${Math.floor(1000 * realmMultiplier)}，灵石奖励：${Math.floor(50 * realmMultiplier)}-${Math.floor(500 * realmMultiplier)}。
        `;
        break;
      case 'secret_realm':
        // 根据风险等级调整奖励范围
        const getRewardRange = (
          risk: '低' | '中' | '高' | '极度危险' | undefined
        ) => {
          if (!risk)
            return {
              expMin: 50,
              expMax: 500,
              stonesMin: 100,
              stonesMax: 1000,
              rarity: '中等',
            };
          const ranges = {
            低: {
              expMin: 50,
              expMax: 300,
              stonesMin: 100,
              stonesMax: 600,
              rarity: '较低',
            },
            中: {
              expMin: 100,
              expMax: 500,
              stonesMin: 200,
              stonesMax: 1000,
              rarity: '中等',
            },
            高: {
              expMin: 200,
              expMax: 800,
              stonesMin: 400,
              stonesMax: 1500,
              rarity: '较高',
            },
            极度危险: {
              expMin: 400,
              expMax: 1200,
              stonesMin: 800,
              stonesMax: 2500,
              rarity: '极高',
            },
          };
          return ranges[risk];
        };
        const rewardRange = getRewardRange(riskLevel);
        const riskText = riskLevel ? `（${riskLevel}风险）` : '';
        typeInstructions = `
            玩家正在【秘境】中探索${riskText}。
            当前境界：${player.realm} (第 ${player.realmLevel} 层)

            环境险恶，但回报丰厚。可能遭遇强大的守护妖兽（高伤害风险）或发现外界绝迹的宝物。
            如果发生战斗，伤害和奖励都应比平时更高。风险等级越高，奖励越丰厚。
            【重要】秘境中虽然危险，但主要是战斗伤害（hpChange可能为负），不应该降低玩家的永久属性（attack、defense、spirit、physique、speed、maxHp）。
            物品稀有度：${rewardRange.rarity}，至少是"稀有"，根据风险等级调整稀有度概率。
            修为奖励：${Math.floor(rewardRange.expMin * realmMultiplier)}-${Math.floor(rewardRange.expMax * realmMultiplier)}，灵石奖励：${Math.floor(rewardRange.stonesMin * realmMultiplier)}-${Math.floor(rewardRange.stonesMax * realmMultiplier)}。
          `;
        break;
      default:
        typeInstructions = `
          这是玩家在修仙界的一次普通日常历练。
          当前境界：${player.realm} (第 ${player.realmLevel} 层)

          事件类型应该多样化，包括但不限于：
          1. 遭遇妖兽战斗（可能受伤，但获得经验和材料）
          2. 发现灵草或材料（获得物品）
          3. 遇到其他修士（可能交易、切磋、或获得信息）
          4. 发现小型洞府或遗迹（获得物品和修为）
          5. 顿悟修炼心得（获得修为）
          6. 遇到危险（受伤但可能获得意外收获）
          7. 发现灵石矿脉（获得灵石）
          8. 救助他人（获得功德和奖励）
          9. 发现灵泉（获得灵气）
          10. 拯救灵兽（获得灵宠）
          11. 【灵宠机缘】灵宠在历练中获得机缘（提升等级、进化、提升属性、获得经验）
          12. 运气好,捡到若干抽奖券(获得抽奖券)
          13. 极小概率获得传承(获得传承,可以直接突破1-4个境界)
          14. 【危险】遭遇邪修或魔修（可能受伤、被抢走灵石、修为降低）
          15. 【危险】触发陷阱（可能受伤、属性降低、修为降低）
          16. 【特殊】触发随机秘境（进入秘境后触发新的随机事件，风险和收益都更高）

          危险事件概率：约15-20%的概率遭遇危险事件（邪修、魔修、陷阱）
          随机秘境概率：约5%的概率触发随机秘境
          大部分时间是普通事件，小概率出现危险或惊喜。
          物品稀有度：${Math.max(0, 60 - realmIndex * 10)}%普通，${Math.min(30 + realmIndex * 5, 50)}%稀有，${Math.min(realmIndex * 3, 20)}%传说。
          修为奖励：${Math.floor(10 * realmMultiplier)}-${Math.floor(100 * realmMultiplier)}，灵石奖励：${Math.floor(5 * realmMultiplier)}-${Math.floor(50 * realmMultiplier)}。
          抽奖券奖励：${Math.floor(1 * realmMultiplier)}-${Math.floor(10 * realmMultiplier)}。
          传承奖励：${Math.floor(1 * realmMultiplier)}-${Math.floor(4 * realmMultiplier)}。

          【物品生成多样化要求】
          请尽量生成多样化的物品，不要总是生成相同类型的物品。物品类型应该包括：
          - 草药类：各种灵草、仙草、灵芝、人参等（提供临时气血/修为恢复）
          - 丹药类：各种丹药、灵丹、仙丹等（提供临时或永久属性提升）
          - 材料类：炼器材料、炼丹材料、灵石、矿石等
          - 武器类：各种剑、刀、枪、戟、鞭等（提供攻击力加成，装备槽位：武器）
          - 护甲类（必须多样化，不要只生成胸甲）：
            * 头部：头盔、头冠、道冠、法冠、仙冠、龙冠、凤冠等（装备槽位：头部）
            * 肩部：护肩、肩甲、云肩、法肩、仙肩等（装备槽位：肩部）
            * 胸甲：道袍、法衣、战甲、法袍、龙鳞甲等（装备槽位：胸甲）
            * 手套：护手、拳套、法手、仙手、龙爪套等（装备槽位：手套）
            * 裤腿：护腿、腿甲、法裤、仙裤、龙鳞裤等（装备槽位：裤腿）
            * 鞋子：战靴、法靴、仙履、云履、龙鳞靴等（装备槽位：鞋子）
          - 首饰类：项链、玉佩、手镯等（提供多种属性加成，装备槽位：首饰1-2）
          - 戒指类：各种戒指（提供属性加成，装备槽位：戒指1-4）
          - 法宝类：各种法宝、灵宝、仙宝等（提供多种属性加成，但不能提供修为加成，装备槽位：法宝1-2）

          【重要】护甲类装备生成时，请确保多样化：
          - 头部、肩部、手套、裤腿、鞋子这些装备槽位应该与胸甲有相似的生成概率
          - 不要总是生成胸甲，应该随机生成不同部位的护甲
          - 护甲类装备的命名应该明确体现部位（如"龙鳞头盔"、"云肩"、"法手"、"仙履"等）

          物品属性应该多样化：
          - 单一属性物品：只提供一种属性加成（如纯攻击、纯防御）
          - 双属性物品：提供两种属性组合（如攻击+速度、防御+气血）
          - 多属性物品：提供3种或更多属性组合（稀有物品）
          - 永久属性物品：使用后永久提升属性（稀有）
          - 临时效果物品：使用后临时恢复气血/修为（常见）

          请根据事件类型和稀有度，创造性地生成不同名称、不同属性组合的物品，避免重复。
        `;
        break;
    }

    const prompt = `
      你是一个文字修仙游戏的GM（Dungeon Master）。
      当前玩家状态：
      - 姓名：${player.name}
      - 境界：${player.realm} (第 ${player.realmLevel} 层)
      - 气血：${player.hp}/${player.maxHp}
      - 攻击力：${player.attack}
      - 防御力：${player.defense}
      - 神识：${player.spirit}
      - 体魄：${player.physique}
      - 速度：${player.speed}

      请生成一个随机奇遇。
      ${typeInstructions}

      【重要约束】
      1. 事件描述（story）必须符合玩家当前境界，使用修仙风格的中文描述，长度控制在50-200字
      2. 所有数值必须合理：气血变化不应超过玩家最大气血的50%，修为和灵石变化应符合境界水平
      3. 事件颜色（eventColor）必须准确反映事件性质：
         - normal：普通事件，无明显收益或损失
         - gain：正面事件，有明显收益（获得物品、修为、灵石等）
         - danger：危险事件，有损失（受伤、被抢、属性降低等）
         - special：特殊事件，罕见且收益丰厚（大机缘、传承、仙品等）
      4. 如果事件描述中提到获得物品，必须在itemObtained或itemsObtained中提供该物品
      5. 物品名称必须符合修仙风格，避免使用现代词汇
      6. 属性降低（attributeReduction）应该非常罕见，且必须与事件描述相符

      请严格以 JSON 格式返回结果。所有文本必须使用中文。
      如果获得物品，请设定合理的属性加成和稀有度。
    `;

    const resultText = await requestSpark(
      [
        {
          role: 'system',
          content:
            '你是一名严谨的修仙游戏GM，需要严格按照用户要求返回结构化数据。\n\n重要规则：\n1. 只返回JSON格式，不要有任何额外的文字说明、解释或描述\n2. 不要使用代码块标记（如```json```），直接返回纯JSON\n3. 所有数字值必须是纯数字格式，例如 "spirit": 8 而不是 "spirit": +8\n4. 不要添加任何注释或说明文字\n5. 确保JSON格式完全正确，可以被直接解析',
        },
        {
          role: 'user',
          content: `${prompt}

【输出要求】
只返回JSON格式，不要有任何额外的文字、说明、解释或描述。不要使用代码块标记，直接返回纯JSON。

【JSON字段定义】
{
  "story": "事件描述（字符串）",
  "hpChange": 气血变化（整数，纯数字，可以是负数）,
  "expChange": 修为变化（整数，纯数字，可以是负数）,
  "spiritStonesChange": 灵石变化（整数，纯数字，可以是负数）,
  "lotteryTicketsChange": 抽奖券变化（整数，可选，纯数字）,
  "inheritanceLevelChange": 传承等级变化（整数1-4，可选，纯数字）,
  "attributeReduction": {
    "attack": 攻击降低（整数，可选，纯数字）,
    "defense": 防御降低（整数，可选，纯数字）,
    "spirit": 神识降低（整数，可选，纯数字）,
    "physique": 体魄降低（整数，可选，纯数字）,
    "speed": 速度降低（整数，可选，纯数字）,
    "maxHp": 气血上限降低（整数，可选，纯数字）
  },
  "triggerSecretRealm": 是否触发随机秘境（布尔值，可选）,
  "eventColor": "事件颜色（normal/gain/danger/special）",
  "itemObtained": {
    "name": "物品名称（字符串）",
    "type": "物品类型（草药/丹药/材料/法宝/武器/护甲/首饰/戒指）",
    "description": "物品描述（字符串，只包含描述文字，不要包含属性信息如[攻+50]等，属性会单独显示）",
    "rarity": "稀有度（普通/稀有/传说/仙品，可选）",
    "isEquippable": 是否可装备（布尔值）,
    "equipmentSlot": "装备槽位（字符串，可选：头部/肩部/胸甲/手套/裤腿/鞋子/戒指1-4/首饰1-2/法宝1-2/武器）",
    "effect": {
      "hp": 气血（整数，可选，纯数字）,
      "exp": 修为（整数，可选，纯数字，注意：装备类物品不能有exp加成）,
      "attack": 攻击（整数，可选，纯数字）,
      "defense": 防御（整数，可选，纯数字）,
      "spirit": 神识（整数，可选，纯数字）,
      "physique": 体魄（整数，可选，纯数字）,
      "speed": 速度（整数，可选，纯数字）
    },
    "permanentEffect": {
      "attack": 攻击（整数，可选，纯数字）,
      "defense": 防御（整数，可选，纯数字）,
      "spirit": 神识（整数，可选，纯数字）,
      "physique": 体魄（整数，可选，纯数字）,
      "speed": 速度（整数，可选，纯数字）,
      "maxHp": 气血上限（整数，可选，纯数字）
    }
  },
  "itemsObtained": [多个物品数组，格式同itemObtained，可选],
  "petObtained": "灵宠模板ID（字符串，可选：pet-spirit-fox/pet-thunder-tiger/pet-phoenix）",
  "petOpportunity": {
    "type": "机缘类型（evolution/level/stats/exp）",
    "petId": "灵宠ID（字符串，可选）",
    "levelGain": 提升等级数（整数，可选，type为level时必需）,
    "expGain": 获得经验（整数，可选，type为exp时必需）,
    "statsBoost": {
      "attack": 攻击提升（整数，可选，纯数字）,
      "defense": 防御提升（整数，可选，纯数字）,
      "hp": 气血提升（整数，可选，纯数字）,
      "speed": 速度提升（整数，可选，纯数字）
    }
  }
}

【重要规则】
1. 只返回JSON，不要有任何其他文字
2. 所有数字必须是纯数字，不要带+号或其他符号
3. 物品类型必须严格使用：草药、丹药、材料、法宝、武器、护甲、首饰、戒指
4. 装备类物品必须设置 isEquippable: true 和正确的 equipmentSlot
5. 法宝不能提供exp（修为）加成，只能提供属性加成
6. 【重要】根据物品名称推断装备类型和槽位（优先级从高到低）：
   - 【武器类】如果物品名称包含以下关键词，必须使用"武器"类型：
     * 剑（如：青莲剑、紫霄剑、玄天剑、飞剑、灵剑、仙剑等）
     * 刀（如：血刀、魔刀、神刀等）
     * 枪/戟/矛（如：长枪、方天戟等）
     * 鞭/棍/棒（如：打神鞭、混元棍等）
     * 弓/弩/匕首（如：射日弓、破魔弩等）
     * 注意：即使描述中提到"灵器"、"法器"等词，只要名称包含"剑/刀/枪"等武器关键词，就是"武器"类型，不是"法宝"
   - 【护甲类】如果物品名称包含以下关键词，使用"护甲"类型，并明确部位：
     * 头部：头盔/头冠/道冠/法冠/仙冠/龙冠/凤冠/冠/帽/发簪/发带/头饰/面罩→头部
     * 肩部：护肩/肩甲/云肩/法肩/仙肩/肩/裘/披风/斗篷→肩部
     * 胸甲：道袍/法衣/战甲/法袍/胸甲/龙鳞甲/铠甲/护胸/长袍/外衣/甲/袍/衣→胸甲
     * 手套：护手/拳套/法手/仙手/龙爪套/手套/手甲/手→手套
     * 裤腿：护腿/腿甲/法裤/仙裤/龙鳞裤/裤/下装/腿→裤腿
     * 鞋子：战靴/法靴/仙履/云履/龙鳞靴/靴/鞋/足/步/履→鞋子
   - 【戒指类】如果物品名称包含：戒指/指环/戒→使用"戒指"类型，equipmentSlot为"戒指1"（系统会自动分配）
   - 【首饰类】如果物品名称包含：项链/玉佩/手镯/手链/吊坠/护符/符/佩/饰→使用"首饰"类型，equipmentSlot为"首饰1"（系统会自动分配）
   - 【法宝类】如果物品名称包含以下关键词，且不包含武器关键词，使用"法宝"类型：
     * 法宝/法器/仙器/神器（注意：如果同时包含"剑/刀/枪"等武器词，优先判定为武器）
     * 鼎/钟/镜/塔/扇/珠/印/盘/笔/袋/旗/炉/图
     * 斧/锤（注意：如果名称明确是"开天斧"、"辟地锤"等，可能是武器，需要根据上下文判断）
     * 注意：如果物品名称同时包含武器关键词（如"剑"）和法宝关键词（如"灵器"），优先判定为"武器"
7. 事件描述必须与奖励/惩罚相匹配：如果描述获得物品，必须提供itemObtained；如果描述受伤，hpChange应为负数
8. 传承等级变化（inheritanceLevelChange）只能为1-4之间的整数，且应该极其罕见（只有大机缘事件才可能出现）
9. 触发随机秘境（triggerSecretRealm）应该非常罕见，只有特殊事件才可能触发
10. 灵宠机缘（petOpportunity）需要玩家已有灵宠时才应该出现，且应该合理（如提升等级、获得经验等）

【物品生成多样化规则】
- 尽量生成不同名称、不同类型的物品，避免重复
- 物品属性组合应该多样化：
  * 单一属性：只加攻击、只加防御、只加气血等
  * 双属性组合：攻击+速度、防御+气血、神识+体魄等
  * 多属性组合：攻击+防御+速度、气血+神识+体魄等（稀有物品）
- 【重要】装备类物品（武器/护甲/首饰/戒指/法宝）必须使用 effect 字段来提供属性加成，不要使用 permanentEffect
- permanentEffect 仅用于消耗品（丹药等）使用后永久增加玩家属性
- 装备类物品的 effect 会在装备时生效，卸下时失效，这是装备的正常机制
- 根据稀有度调整属性数值：
  * 普通：单一属性10-30，双属性各5-15
  * 稀有：单一属性30-80，双属性各15-40，三属性各10-25
  * 传说：单一属性80-200，双属性各40-100，三属性各25-60
  * 仙品：单一属性200-500，双属性各100-250，三属性各60-150
- 创造性地命名物品，使用修仙风格的名称（如：青莲剑、紫霄钟、玄天镜、九幽塔等）

【护甲装备生成概率要求（重要）】
当生成护甲类装备时，必须确保各部位装备的生成概率相对均衡：
- 头部装备：约15-20%的概率（如：龙鳞头盔、仙冠、道冠等）
- 肩部装备：约15-20%的概率（如：云肩、护肩、法肩等）
- 胸甲装备：约15-20%的概率（如：道袍、法衣、龙鳞甲等）
- 手套装备：约15-20%的概率（如：法手、护手、龙爪套等）
- 裤腿装备：约15-20%的概率（如：护腿、法裤、龙鳞裤等）
- 鞋子装备：约15-20%的概率（如：仙履、战靴、云履等）
不要总是生成胸甲，应该随机选择不同部位的护甲装备，确保玩家能够获得完整的装备套装。

【秘境属性降低规则】
- 属性降低应该非常罕见，只有在极度危险的事件中才发生
- 如果发生属性降低，降低数值应该较小（通常为玩家当前属性的5-10%）
- 属性降低时，必须提供丰厚的补偿（如稀有物品、大量修为、灵石等）
- 建议：只有约10-15%的秘境事件是危险的，且危险事件中只有约30%会降低属性`,
        },
      ],
      0.95
    );

    // 清理JSON字符串中的无效格式
    const cleanedJson = cleanJsonString(resultText);

    try {
      return JSON.parse(cleanedJson) as AdventureResult;
    } catch (parseError) {
      console.error('JSON解析失败，原始内容:', resultText);
      console.error('清理后的内容:', cleanedJson);
      console.error('解析错误:', parseError);
      throw new Error(`JSON解析失败: ${parseError}`);
    }
  } catch (error) {
    console.error('Spark Adventure Error:', error);
    // Fallback in case of API error
    return {
      story: '你在荒野中游荡了一番，可惜大道渺茫，此次一无所获。',
      hpChange: 0,
      expChange: 5,
      spiritStonesChange: 0,
      eventColor: 'normal',
    };
  }
};

export const generateBreakthroughFlavorText = async (
  realm: string,
  success: boolean
): Promise<string> => {
  if (!API_KEY) return success ? '突破成功！' : '突破失败！';

  try {
    const prompt = `
      描述一名修仙者尝试突破到 ${realm} 的过程。
      结果：${success ? '成功' : '失败'}。
      请保持简短（不超过2句话），使用玄幻、仙侠风格，提及灵气涌动、经脉或天劫等元素。
      请使用中文输出。
    `;

    const content = await requestSpark(
      [
        {
          role: 'system',
          content: '你是仙侠小说作家，擅长以唯美中文描绘修仙突破场景。',
        },
        { role: 'user', content: prompt },
      ],
      0.8
    );

    return (
      content.trim() ||
      (success ? '天地震动，你成功突破瓶颈！' : '你气血翻涌，突破失败了。')
    );
  } catch (e) {
    return success ? '突破成功！' : '突破失败！';
  }
};

export const generateEnemyName = async (
  realm: RealmType,
  adventureType: AdventureType
): Promise<{ name: string; title: string }> => {
  if (!API_KEY) {
    // 如果API不可用，返回空对象，让调用者使用预设列表
    return { name: '', title: '' };
  }

  try {
    // RealmType 枚举的值已经是中文名称（如 '炼气期'、'筑基期'）
    const realmName = realm;

    const adventureContext =
      adventureType === 'secret_realm'
        ? '秘境中'
        : adventureType === 'lucky'
          ? '机缘之地'
          : '荒野中';

    const prompt = `
      在修仙游戏中，玩家在${adventureContext}遭遇了一个敌人。
      敌人境界：${realmName}

      请生成一个符合修仙风格的敌人名字和称号。
      名字可以是妖兽名（如：血牙狼、玄煞蛛）或修士名（如：断魂剑客、血手魔修）。
      称号应该描述敌人的身份（如：荒原妖兽、邪修、秘境守卫）。

      请以JSON格式返回，格式为：
      {
        "name": "敌人名字（2-4个字）",
        "title": "敌人称号（2-5个字）"
      }

      只返回JSON，不要其他内容。
    `;

    const content = await requestSpark(
      [
        {
          role: 'system',
          content:
            '你是修仙游戏的设计师，擅长创造符合仙侠风格的敌人名称。请严格返回JSON格式。',
        },
        { role: 'user', content: prompt },
      ],
      0.9
    );

    const cleaned = stripCodeFence(content);
    const parsed = JSON.parse(cleaned);

    if (parsed.name && parsed.title) {
      return {
        name: parsed.name.trim(),
        title: parsed.title.trim(),
      };
    }

    return { name: '', title: '' };
  } catch (e) {
    console.error('AI生成敌人名字失败:', e);
    return { name: '', title: '' };
  }
};
