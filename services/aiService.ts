import {
  PlayerStats,
  AdventureResult,
  AdventureType,
  RealmType,
} from '../types';
import { REALM_ORDER, REALM_DATA } from '../constants';
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
const USE_PROXY = aiConfig.useProxy;

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

// 请求去重缓存，防止短时间内重复请求
const requestCache = new Map<string, { timestamp: number; promise: Promise<string> }>();
const CACHE_DURATION = 1000; // 1秒内的重复请求使用缓存

// 请求队列，确保同一时间只有一个AI请求在进行
interface QueuedRequest {
  messages: ChatMessage[];
  temperature: number;
  maxTokens?: number;
  resolve: (value: string) => void;
  reject: (error: Error) => void;
}

let requestQueue: QueuedRequest[] = [];
let isProcessing = false;

// 处理请求队列
const processQueue = async () => {
  if (isProcessing || requestQueue.length === 0) {
    return;
  }

  isProcessing = true;

  while (requestQueue.length > 0) {
    const request = requestQueue.shift();
    if (!request) break;

    try {
      const result = await executeRequest(request.messages, request.temperature, request.maxTokens);
      request.resolve(result);
    } catch (error) {
      request.reject(error instanceof Error ? error : new Error(String(error)));
    }
  }

  isProcessing = false;
};

// 执行实际的AI请求
const executeRequest = async (messages: ChatMessage[], temperature = 0.7, maxTokens?: number): Promise<string> => {
  // 如果使用代理，API Key 在服务器端处理，前端不需要发送
  // 如果不使用代理，需要检查 API Key 是否存在
  if (!USE_PROXY && !API_KEY) {
    throw new Error('AI API key is missing');
  }

  // 生成请求缓存键（基于消息内容）
  const cacheKey = JSON.stringify(messages);
  const cached = requestCache.get(cacheKey);
  const now = Date.now();

  // 如果缓存存在且未过期，返回缓存的promise（双重检查，防止队列中的重复请求）
  if (cached && now - cached.timestamp < CACHE_DURATION) {
    return cached.promise;
  }

  // 构建请求头：使用代理时不发送 Authorization（由服务器端处理）
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // 只有在不使用代理时才在前端添加 Authorization 头
  if (!USE_PROXY && API_KEY) {
    headers.Authorization = `Bearer ${API_KEY}`;
  }

  // 创建请求promise
  const requestPromise = (async () => {
    const requestBody: Record<string, unknown> = {
      model: API_MODEL,
      messages,
      response_format: {"type": "json_object"},
      temperature,
    };

    // 如果指定了max_tokens，添加到请求中（限制输出长度，加快响应）
    if (maxTokens) {
      requestBody.max_tokens = maxTokens;
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`天道出现了裂痕，冒险失败: (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const content = parseMessageContent(data?.choices?.[0]?.message?.content);

    if (!content) {
      throw new Error('大道渺茫，仙缘难觅，请重新尝试。');
    }

    return content;
  })();

  // 缓存请求promise
  requestCache.set(cacheKey, { timestamp: now, promise: requestPromise });

  // 清理过期缓存（每10秒清理一次）
  if (Math.random() < 0.1) { // 10%概率清理，避免频繁清理
    for (const [key, value] of requestCache.entries()) {
      if (now - value.timestamp > CACHE_DURATION * 10) {
        requestCache.delete(key);
      }
    }
  }

  return requestPromise;
};

// 请求模型（带队列）
const requestModel = async (messages: ChatMessage[], temperature = 0.7, maxTokens?: number): Promise<string> => {
  // 如果使用代理，API Key 在服务器端处理，前端不需要发送
  // 如果不使用代理，需要检查 API Key 是否存在
  if (!USE_PROXY && !API_KEY) {
    throw new Error('AI API key is missing');
  }

  // 生成请求缓存键（基于消息内容）
  const cacheKey = JSON.stringify(messages);
  const cached = requestCache.get(cacheKey);
  const now = Date.now();

  // 如果缓存存在且未过期，直接返回缓存的promise（不加入队列）
  if (cached && now - cached.timestamp < CACHE_DURATION) {
    return cached.promise;
  }

  // 将请求加入队列
  return new Promise<string>((resolve, reject) => {
    requestQueue.push({
      messages,
      temperature,
      maxTokens,
      resolve,
      reject,
    });

    // 触发队列处理
    processQueue();
  });
};

export const generateAdventureEvent = async (player: PlayerStats, adventureType: AdventureType = 'normal', riskLevel?: '低' | '中' | '高' | '极度危险', realmName?: string, realmDescription?: string): Promise<AdventureResult> => {
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

    // 根据境界调整事件类型和奖励（指数增长，高境界奖励大幅提升）
    const realmIndex = REALM_ORDER.indexOf(player.realm);
    // 境界倍数：指数增长 [1, 2, 4, 8, 16, 32, 64]
    const realmBaseMultipliers = [1, 2, 4, 8, 16, 32, 64];
    const realmBaseMultiplier = realmBaseMultipliers[realmIndex] || 1;
    // 境界等级加成：每级增加30%
    const levelMultiplier = 1 + (player.realmLevel - 1) * 0.3;
    const realmMultiplier = realmBaseMultiplier * levelMultiplier;

    switch (adventureType) {
      case 'lucky':
        typeInstructions = `【大机缘事件】极其罕见的正面事件，eventColor="special"。
境界匹配：低境界（炼气/筑基）→古洞府/稀有功法/高人指点；中境界（金丹/元婴）→上古遗迹/传说法宝/顿悟；高境界（化神+）→仙府/仙品至宝/无上大道。
物品命名：必须使用独特、高雅的名称，体现大机缘的珍贵性（如：九天玄剑、太虚仙丹、混沌钟、真仙玲珑塔等），避免使用普通物品名称。
物品稀有度：低境界"稀有/传说"，高境界"传说/仙品"。
奖励范围：修为${Math.floor(100 * realmMultiplier)}-${Math.floor(1000 * realmMultiplier)}，灵石${Math.floor(50 * realmMultiplier)}-${Math.floor(500 * realmMultiplier)}。`;
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

        // 如果有秘境名称和描述，加入提示词中
        const realmContext = realmName
          ? `\n\n【重要】玩家正在探索的秘境名为：【${realmName}】${realmDescription ? `，秘境特点：${realmDescription}` : ''}。\n所有生成的事件描述必须与【${realmName}】这个秘境的特点紧密关联！`
          : '';

        // 精简秘境提示词
        const realmKeywords = realmName ? `\n【关键】事件必须紧扣【${realmName}】特点：${realmDescription || '根据名称推断环境'}。名称关键词对应场景：山脉/万兽→山林妖兽；剑/剑冢→剑修遗迹；雷/雷罚→雷电；幽冥/九幽→阴气鬼物；火/熔岩→火焰；冰/雪域→冰雪；毒/毒瘴→毒气；幻境/迷窟→幻象；血海/魔渊→魔气；星辰/遗迹→古代遗迹；龙族/古墓→龙族墓葬；仙灵→仙气；天劫/雷池→天劫；混沌/虚空→空间；时光/裂缝→时空；死亡/峡谷→死亡；神魔/战场→战斗。` : '';

        typeInstructions = `【秘境探索】${riskText}${realmContext}
事件类型：守护妖兽/绝迹宝物/机关陷阱/宝库传承/其他修士/秘境秘密/空间裂缝。
场景：古老遗迹/奇异地形/神秘禁地/自然奇观。风险越高场景越危险。
描述要求：环境+探索过程+事件细节，每次不同。
${realmKeywords}
注意：主要是战斗伤害（hpChange可为负），不降低永久属性。
物品命名：根据秘境特点和风险等级，创造与秘境相关的独特物品名称（如：${realmName ? `${realmName}中可产出与秘境主题相关的物品` : '秘境相关的独特物品'}），名称需体现秘境的神秘性和特殊性，避免使用常见物品名称。
【关键】如果返回itemsObtained数组，数组中的每个物品名称必须完全不同，不能有任何重复，特别是装备类物品，每个装备必须有独特的名称（如：星辰盘、天机镜、混沌印等，不能重复）。
物品稀有度：${rewardRange.rarity}（至少"稀有"）。
奖励：修为${Math.floor(rewardRange.expMin * realmMultiplier)}-${Math.floor(rewardRange.expMax * realmMultiplier)}，灵石${Math.floor(rewardRange.stonesMin * realmMultiplier)}-${Math.floor(rewardRange.stonesMax * realmMultiplier)}。`;
        break;
      default:
        typeInstructions = `【普通历练】日常历练事件。
事件类型：妖兽战斗/发现灵草/遇到修士/小型洞府/顿悟/危险/灵石矿脉/救助/灵泉/灵宠/灵宠机缘/传承(极罕见)/邪修魔修(15-20%危险)/陷阱(15-20%危险)/随机秘境(5%)。
场景描述：必须包含环境(10-30字)+动作(10-20字)+事件细节(20-50字)+感受(可选)，每次不同，避免重复开头。
物品类型多样化：草药/丹药/材料/武器/护甲(头部/肩部/胸甲/手套/裤腿/鞋子各15-20%)/首饰/戒指/法宝。
物品命名：每次必须使用不同的物品名称，根据事件场景创造新的名称组合，避免模板化重复（如：不要总是"青钢剑"、"回血丹"等常见名称，要创造"赤焰刀"、"凝元丹"、"寒霜枪"等多样化名称）。
物品稀有度：${Math.max(0, 60 - realmIndex * 10)}%普通，${Math.min(30 + realmIndex * 5, 50)}%稀有，${Math.min(realmIndex * 3, 20)}%传说。
奖励：修为${Math.floor(10 * realmMultiplier)}-${Math.floor(100 * realmMultiplier)}，灵石${Math.floor(5 * realmMultiplier)}-${Math.floor(50 * realmMultiplier)}，传承${Math.floor(1 * realmMultiplier)}-${Math.floor(4 * realmMultiplier)}（极罕见）。`;
        break;
    }

    // 获取境界基础属性，用于装备数值平衡
    const realmData = REALM_DATA[player.realm];
    const realmLevelMultiplier = 1 + (player.realmLevel - 1) * 0.05;
    const baseAttack = Math.floor(realmData.baseAttack * realmLevelMultiplier);
    const baseDefense = Math.floor(realmData.baseDefense * realmLevelMultiplier);
    const baseHp = Math.floor(realmData.baseMaxHp * realmLevelMultiplier);
    const baseSpirit = Math.floor(realmData.baseSpirit * realmLevelMultiplier);
    const basePhysique = Math.floor(realmData.basePhysique * realmLevelMultiplier);
    const baseSpeed = Math.floor(realmData.baseSpeed * realmLevelMultiplier);

    // 计算各稀有度的装备数值范围（基于境界基础属性的百分比）
    const getEquipmentValueRange = (rarity: string) => {
      const ranges: Record<string, { min: number; max: number }> = {
        普通: { min: 0.05, max: 0.08 },
        稀有: { min: 0.08, max: 0.12 },
        传说: { min: 0.12, max: 0.18 },
        仙品: { min: 0.18, max: 0.25 },
      };
      const range = ranges[rarity] || ranges['普通'];
      return {
        attack: `${Math.floor(baseAttack * range.min)}-${Math.floor(baseAttack * range.max)}`,
        defense: `${Math.floor(baseDefense * range.min)}-${Math.floor(baseDefense * range.max)}`,
        hp: `${Math.floor(baseHp * range.min)}-${Math.floor(baseHp * range.max)}`,
        spirit: `${Math.floor(baseSpirit * range.min)}-${Math.floor(baseSpirit * range.max)}`,
        physique: `${Math.floor(basePhysique * range.min)}-${Math.floor(basePhysique * range.max)}`,
        speed: `${Math.floor(baseSpeed * range.min)}-${Math.floor(baseSpeed * range.max)}`,
      };
    };

    const commonRange = getEquipmentValueRange('普通');
    const rareRange = getEquipmentValueRange('稀有');
    const legendaryRange = getEquipmentValueRange('传说');
    const immortalRange = getEquipmentValueRange('仙品');

    // 精简的prompt，移除大量重复示例
    const prompt = `玩家状态：${player.name}，${player.realm}第${player.realmLevel}层，气血${player.hp}/${player.maxHp}，攻击${player.attack}，防御${player.defense}，神识${player.spirit}，体魄${player.physique}，速度${player.speed}。
境界基础属性（用于装备数值参考）：攻击${baseAttack}，防御${baseDefense}，气血${baseHp}，神识${baseSpirit}，体魄${basePhysique}，速度${baseSpeed}。

${typeInstructions}

描述要求：story需50-200字，包含环境(地点/氛围/时间)+动作(探索/发现/战斗)+事件细节(视觉/听觉/嗅觉)+感受，每次不同，避免重复开头句式。`;

    // 精简的system message，将详细规则移到这里以减少user message的token数
    const systemMessage = `你是修仙游戏GM，严格返回JSON格式数据。

核心规则：
1. 只返回纯JSON，无额外文字、代码块标记、注释
2. 数字格式：纯数字（如"spirit": 8），禁止+8等格式
3. 缺失字段直接省略，不输出null/undefined/空字符串
4. eventColor匹配事件：danger=损失，gain=收益，special=大机缘，normal=普通
5. hpChange绝对值≤maxHp*50%（向下取整）
6. 禁止重复模板，每次改写开头句式
7. equipmentSlot不冲突（戒指/首饰自动分配除外）
8. attributeReduction仅极度危险事件，需稀有奖励补偿

物品规则：
- 类型：草药/丹药/材料/法宝/武器/护甲/首饰/戒指
- 装备类型判断：剑/刀/枪→武器；头盔/冠→头部；道袍/甲→胸甲；戒指/戒→戒指；项链/玉佩→首饰；鼎/钟/镜→法宝
- 装备用effect，消耗品用permanentEffect
- 法宝不能有exp加成
- 装备数值必须严格根据玩家境界平衡（参考prompt中的境界基础属性）：
  * 普通装备：攻击${commonRange.attack}，防御${commonRange.defense}，气血${commonRange.hp}，神识${commonRange.spirit}，体魄${commonRange.physique}，速度${commonRange.speed}
  * 稀有装备：攻击${rareRange.attack}，防御${rareRange.defense}，气血${rareRange.hp}，神识${rareRange.spirit}，体魄${rareRange.physique}，速度${rareRange.speed}
  * 传说装备：攻击${legendaryRange.attack}，防御${legendaryRange.defense}，气血${legendaryRange.hp}，神识${legendaryRange.spirit}，体魄${legendaryRange.physique}，速度${legendaryRange.speed}
  * 仙品装备：攻击${immortalRange.attack}，防御${immortalRange.defense}，气血${immortalRange.hp}，神识${immortalRange.spirit}，体魄${immortalRange.physique}，速度${immortalRange.speed}
- 装备数值必须在对应稀有度的范围内，不要超出范围
- 护甲部位均衡：头部/肩部/胸甲/手套/裤腿/鞋子各15-20%概率

物品命名规则（重要）：
- 物品名称必须高度多样化，避免重复使用相同的名称组合
- 【关键】如果返回itemsObtained数组，数组中的每个物品名称必须完全不同，不能有任何重复，特别是装备类物品
- 命名风格建议：
  * 草药：结合生长环境/颜色/功效命名（如：寒潭碧莲、赤炎草、凝血参、月华花、雷鸣藤、毒瘴菇）
  * 丹药：结合功效/材料/境界命名（如：聚气丹、回元丹、破障丹、凝神丹、筑基丹、淬体丹）
  * 材料：结合来源/特性/用途命名（如：玄铁矿、龙鳞、凤羽、星辰石、天外陨铁、千年寒冰）
  * 武器：结合材质/特性/风格命名（如：青锋剑、血煞刀、雷霆枪、玄冰扇、烈阳弓、幽魂钩）
  * 护甲：结合材质/特性/部位命名（如：流云道袍、玄铁重甲、龙鳞护心镜、疾风靴、金刚护腕）
  * 首饰：结合材质/功效/风格命名（如：清心玉佩、聚灵项链、护魂手镯、辟邪符、凝神戒）
  * 法宝：结合功效/形态/特性命名（如：镇魂钟、炼妖鼎、照妖镜、遁天梭、聚宝盆、诛仙剑）
- 稀有度命名区分：
  * 普通：使用基础词汇（如：精铁剑、回血丹、灵草）
  * 稀有：加入修饰词（如：寒冰灵剑、上品回血丹、百年灵草）
  * 传说：使用高级词汇（如：九幽寒冰剑、极品回天丹、千年血参）
  * 仙品：使用仙侠风格词汇（如：太虚仙剑、九转回天丹、万载仙草）
- 每次生成物品时，必须创造新的名称组合，避免使用模板化名称`;

    // 精简的user message，移除大量重复示例
    const userMessage = `${prompt}

返回JSON格式（无其他文字）：
{
  "story": "事件描述（50-200字，包含环境+动作+事件细节+感受，避免重复开头）",
  "hpChange": 整数,
  "expChange": 整数,
  "spiritStonesChange": 整数,
  "eventColor": "normal/gain/danger/special",
  "itemObtained": {物品对象，可选},
  "itemsObtained": [物品数组，可选],
  "inheritanceLevelChange": 1-4整数（可选，极罕见）,
  "triggerSecretRealm": 布尔值（可选，极罕见）,
  "petObtained": "pet-spirit-fox/pet-thunder-tiger/pet-phoenix"（可选）,
  "petOpportunity": {机缘对象，可选},
  "attributeReduction": {属性降低对象，可选，仅极度危险}
}

重要：
- story需多样化场景描述，避免30%以上相同开头
- 物品名称必须高度多样化，每次使用不同的名称组合，避免重复模板化名称
- 物品名称需与story描述一致，根据事件场景选择合适的名称风格
- 装备槽位不重复
- hpChange需匹配story描述的事件性质
- 【关键】如果使用itemsObtained数组，数组中的每个物品名称必须完全不同，不能有重复名称，特别是装备类物品，每个装备必须有独特的名称`;

    const resultText = await requestModel(
      [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage },
      ],
      0.95, // 降低temperature从0.95到0.7，加快响应速度
    );

    // 清理JSON字符串中的无效格式
    const cleanedJson = cleanJsonString(resultText);

    try {
      const parsed = JSON.parse(cleanedJson) as AdventureResult;

      // 验证并确保所有必需字段都有有效的数字值
      // 如果字段缺失、为null、undefined或NaN，则使用默认值
      const ensureNumber = (value: unknown, defaultValue: number): number => {
        if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
          return value;
        }
        if (typeof value === 'string') {
          const parsed = Number(value);
          if (!isNaN(parsed) && isFinite(parsed)) {
            return parsed;
          }
        }
        return defaultValue;
      };

      // 确保必需字段存在且为有效数字
      const validatedResult: AdventureResult = {
        story: parsed.story || '你在荒野中游荡了一番，可惜大道渺茫，此次一无所获。',
        hpChange: ensureNumber(parsed.hpChange, 0),
        expChange: ensureNumber(parsed.expChange, 0),
        spiritStonesChange: ensureNumber(parsed.spiritStonesChange, 0),
        eventColor: parsed.eventColor || 'normal',
        // 保留可选字段
        ...(parsed.lotteryTicketsChange !== undefined && { lotteryTicketsChange: ensureNumber(parsed.lotteryTicketsChange, 0) }),
        ...(parsed.inheritanceLevelChange !== undefined && { inheritanceLevelChange: ensureNumber(parsed.inheritanceLevelChange, 0) }),
        ...(parsed.attributeReduction && { attributeReduction: parsed.attributeReduction }),
        ...(parsed.triggerSecretRealm !== undefined && { triggerSecretRealm: parsed.triggerSecretRealm }),
        ...(parsed.itemObtained && { itemObtained: parsed.itemObtained }),
        ...(parsed.itemsObtained && { itemsObtained: parsed.itemsObtained }),
        ...(parsed.petObtained && { petObtained: parsed.petObtained }),
        ...(parsed.petOpportunity && { petOpportunity: parsed.petOpportunity }),
      };

      return validatedResult;
    } catch (parseError) {
      console.error('JSON解析失败，原始内容:', resultText);
      console.error('清理后的内容:', cleanedJson);
      console.error('解析错误:', parseError);
      throw new Error(`JSON解析失败: ${parseError}`);
    }
  } catch (error) {
    console.error('天道出现了裂痕，冒险失败:', error);
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

// 突破描述模板库 - 按境界渐进式描述
const BREAKTHROUGH_DESCRIPTIONS: Record<string, Array<(playerName: string, realm: string) => string>> = {
  // 炼气期 - 入门阶段，描述简单朴实
  '炼气期': [
    (playerName: string, realm: string) => `${playerName}盘膝而坐，按照基础功法运转，体内微弱的灵气开始流动。随着灵气的积累，${playerName}感受到瓶颈的松动，成功突破到了${realm}！`,
    (playerName: string, realm: string) => `${playerName}静心凝神，引导体内稀薄的灵气冲击经脉。经过一番努力，灵气终于冲破阻碍，${playerName}成功踏入了${realm}的境界！`,
    (playerName: string, realm: string) => `${playerName}日复一日地修炼，体内灵气逐渐充盈。终于，在某个时刻，${playerName}感受到境界的突破，成功达到了${realm}！`,
    (playerName: string, realm: string) => `${playerName}运转基础心法，灵气在经脉中缓缓流动。随着修炼的深入，${playerName}成功突破了瓶颈，踏入了${realm}的境界！`,
    (playerName: string, realm: string) => `${playerName}在修炼中感受到灵气的增长，体内传来轻微的震动。经过不懈努力，${playerName}成功突破到了${realm}，修为略有精进！`,
  ],

  // 筑基期 - 奠定基础，描述开始有气势
  '筑基期': [
    (playerName: string, realm: string) => `${playerName}盘膝而坐，运转功法，体内灵气如溪流般汇聚。随着灵气的不断积累，${playerName}感受到根基的稳固，成功突破到了${realm}！周身灵气翻涌，实力明显提升。`,
    (playerName: string, realm: string) => `天地灵气缓缓汇聚，${playerName}闭目凝神，引导灵气冲击瓶颈。经脉中传来阵阵轻响，如细流汇入江河。终于，${playerName}突破了桎梏，踏入了${realm}的境界！`,
    (playerName: string, realm: string) => `${playerName}静坐修炼，周身泛起淡淡光华。体内灵气核心开始凝聚，灵气如泉水般涌入。伴随着一声轻喝，${playerName}成功突破到了${realm}，修为稳步提升！`,
    (playerName: string, realm: string) => `${playerName}运转心法，体内灵气如江河般奔腾不息。经脉在灵气的滋养下不断强化，最终突破了瓶颈。${playerName}成功踏入了${realm}的境界，根基更加稳固！`,
    (playerName: string, realm: string) => `${playerName}闭关修炼，日复一日地积累修为。终于，在某个清晨，${playerName}感受到瓶颈松动。全力冲击之下，${playerName}成功突破到了${realm}，出关时已是另一番天地！`,
  ],

  // 金丹期 - 凝聚金丹，描述更加宏大
  '金丹期': [
    (playerName: string, realm: string) => `${playerName}盘膝而坐，运转功法，体内灵气如江河般奔腾不息。随着一声轻喝，瓶颈应声而破，${playerName}成功突破到了${realm}！周身灵气翻涌，实力大增。`,
    (playerName: string, realm: string) => `天地灵气汇聚，${playerName}闭目凝神，引导灵气冲击瓶颈。经脉中传来阵阵轰鸣，如雷鸣般震撼。终于，${playerName}突破了桎梏，踏入了${realm}的境界！`,
    (playerName: string, realm: string) => `${playerName}静坐洞府，周身霞光万丈。体内灵气核心剧烈震动，灵气如潮水般涌入。伴随着一声长啸，${playerName}成功突破到了${realm}，修为突飞猛进！`,
    (playerName: string, realm: string) => `${playerName}运转心法，体内灵气如火山爆发般喷涌而出。经脉在灵气的冲击下不断扩张，最终突破了瓶颈。${playerName}成功踏入了${realm}的境界，周身气息更加深邃。`,
    (playerName: string, realm: string) => `${playerName}服下灵丹，药力在体内化开。配合功法运转，${playerName}引导药力冲击瓶颈。在灵丹的辅助下，${playerName}成功突破到了${realm}，修为精进！`,
  ],

  // 元婴期 - 元婴出窍，描述更加神秘
  '元婴期': [
    (playerName: string, realm: string) => `天地异象显现，${playerName}周身环绕着五彩霞光。体内灵气如龙蛇般游走，不断冲击着境界壁垒。终于，壁垒破碎，${playerName}成功突破到了${realm}，实力暴涨！`,
    (playerName: string, realm: string) => `${playerName}深入秘境，寻得一处灵脉。盘坐于灵脉之上，${playerName}运转功法，疯狂吸收天地灵气。随着灵气的不断涌入，${playerName}成功突破到了${realm}的境界！`,
    (playerName: string, realm: string) => `月夜之下，${playerName}立于山巅，引动天地灵气。星辰之力汇聚而来，化作一道光柱直冲云霄。${playerName}在灵气的洗礼下，成功突破到了${realm}，实力更上一层楼！`,
    (playerName: string, realm: string) => `${playerName}在战斗中感悟，生死搏杀中激发潜能。战斗中积累的感悟如潮水般涌来，${playerName}在战斗中突破，成功踏入了${realm}的境界！`,
    (playerName: string, realm: string) => `天地震动，${playerName}在突破的瞬间，体内传来阵阵龙吟。灵气如真龙般在经脉中游走，最终冲破桎梏。${playerName}成功突破到了${realm}，龙威显现！`,
  ],

  // 化神期 - 神识化神，描述更加超凡
  '化神期': [
    (playerName: string, realm: string) => `雷声轰鸣，${playerName}在雷劫中淬炼己身。天雷之力不断轰击，却无法撼动${playerName}的意志。最终，${playerName}在雷劫中涅槃重生，成功突破到了${realm}！`,
    (playerName: string, realm: string) => `星辰之力降临，${playerName}沐浴在星光之中。体内灵气与星辰之力交融，不断淬炼着肉身和神魂。最终，${playerName}在星辰之力的帮助下，成功突破到了${realm}！`,
    (playerName: string, realm: string) => `生死之间，${playerName}在绝境中领悟大道。体内灵气在生死边缘爆发，如凤凰涅槃般重生。${playerName}在绝境中突破，成功踏入了${realm}的境界！`,
    (playerName: string, realm: string) => `${playerName}寻得一处上古遗迹，在其中获得了传承。传承之力在体内爆发，${playerName}借助传承之力冲击瓶颈。在传承的帮助下，${playerName}成功突破到了${realm}的境界！`,
    (playerName: string, realm: string) => `天地变色，${playerName}周身环绕着强大的威压。神识如实质般显现，不断冲击着境界壁垒。终于，${playerName}的神识突破桎梏，成功踏入了${realm}的境界！`,
  ],

  // 炼虚期 - 虚空炼体，描述接近仙人
  '炼虚期': [
    (playerName: string, realm: string) => `虚空震动，${playerName}在虚空中淬炼己身。空间之力不断撕扯着肉身，却无法撼动${playerName}的意志。最终，${playerName}在虚空中涅槃重生，成功突破到了${realm}！`,
    (playerName: string, realm: string) => `天地法则显现，${playerName}周身环绕着法则之力。体内灵气与法则交融，不断淬炼着肉身和神魂。最终，${playerName}在法则的帮助下，成功突破到了${realm}！`,
    (playerName: string, realm: string) => `九天神雷降临，${playerName}在雷劫中淬炼己身。天雷之力不断轰击，却无法撼动${playerName}的意志。最终，${playerName}在雷劫中涅槃重生，成功突破到了${realm}！`,
    (playerName: string, realm: string) => `天地异象显现，${playerName}周身环绕着仙光。体内灵气如仙气般流转，不断冲击着境界壁垒。终于，壁垒破碎，${playerName}成功突破到了${realm}，实力暴涨！`,
    (playerName: string, realm: string) => `${playerName}在虚空中感悟，空间之力不断涌入体内。肉身在空间之力的淬炼下不断强化，最终突破了瓶颈。${playerName}成功踏入了${realm}的境界，接近仙人！`,
  ],

  // 渡劫飞升 - 成仙之路，描述最为宏大
  '渡劫飞升': [
    (playerName: string, realm: string) => `九天之上，雷劫降临！${playerName}在九重天劫中淬炼己身。天雷之力不断轰击，却无法撼动${playerName}的意志。最终，${playerName}在雷劫中涅槃重生，成功突破到了${realm}！`,
    (playerName: string, realm: string) => `天地法则显现，${playerName}周身环绕着仙光。体内灵气如仙气般流转，不断冲击着境界壁垒。终于，壁垒破碎，${playerName}成功突破到了${realm}，实力暴涨！`,
    (playerName: string, realm: string) => `虚空震动，${playerName}在虚空中感悟大道。空间之力不断涌入体内，肉身在空间之力的淬炼下不断强化。最终，${playerName}成功踏入了${realm}的境界，成仙之路已开启！`,
    (playerName: string, realm: string) => `九天神雷降临，${playerName}在雷劫中淬炼己身。天雷之力不断轰击，却无法撼动${playerName}的意志。最终，${playerName}在雷劫中涅槃重生，成功突破到了${realm}！`,
    (playerName: string, realm: string) => `天地异象显现，${playerName}周身环绕着仙光。体内灵气如仙气般流转，不断冲击着境界壁垒。终于，壁垒破碎，${playerName}成功突破到了${realm}，成仙之路已开启！`,
  ],
};

export const generateBreakthroughFlavorText = async (
  realm: string,
  success: boolean,
  playerName?: string,
  currentRealm?: string
): Promise<string> => {
  if (!success) {
    // 失败描述也根据境界区分
    if (currentRealm === '渡劫飞升' || currentRealm === '炼虚期') {
      return playerName
        ? `${playerName}尝试冲击瓶颈，奈何天劫之力过于强大，惨遭反噬！修为大损，需要重新积累。`
        : '你尝试冲击瓶颈，奈何天劫之力过于强大，惨遭反噬！修为大损，需要重新积累。';
    } else if (currentRealm === '化神期' || currentRealm === '元婴期') {
      return playerName
        ? `${playerName}尝试冲击瓶颈，奈何根基不稳，神识受损，惨遭反噬！`
        : '你尝试冲击瓶颈，奈何根基不稳，神识受损，惨遭反噬！';
    } else {
      return playerName
        ? `${playerName}尝试冲击瓶颈，奈何根基不稳，惨遭反噬！`
        : '你尝试冲击瓶颈，奈何根基不稳，惨遭反噬！';
    }
  }

  // 根据目标境界选择描述模板
  // 如果 realm 包含"第 X 层"，则提取境界名称
  const realmName = realm.includes('第') ? realm.split('第')[0].trim() : realm;

  // 获取对应境界的描述模板，如果没有则使用通用描述
  const descriptions = BREAKTHROUGH_DESCRIPTIONS[realmName] || BREAKTHROUGH_DESCRIPTIONS['金丹期'];

  const randomIndex = Math.floor(Math.random() * descriptions.length);
  const descriptionTemplate = descriptions[randomIndex];
  const name = playerName || '你';

  return descriptionTemplate(name, realm);
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

    const content = await requestModel(
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
