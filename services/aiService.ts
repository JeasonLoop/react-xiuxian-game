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

const requestModel = async (messages: ChatMessage[], temperature = 0.8) => {
  // 如果使用代理，API Key 在服务器端处理，前端不需要发送
  // 如果不使用代理，需要检查 API Key 是否存在
  if (!USE_PROXY && !API_KEY) {
    throw new Error('AI API key is missing');
  }

  // 构建请求头：使用代理时不发送 Authorization（由服务器端处理）
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // 只有在不使用代理时才在前端添加 Authorization 头
  if (!USE_PROXY && API_KEY) {
    headers.Authorization = `Bearer ${API_KEY}`;
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers,
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

        // 如果有秘境名称和描述，加入提示词中
        const realmContext = realmName
          ? `\n\n【重要】玩家正在探索的秘境名为：【${realmName}】${realmDescription ? `，秘境特点：${realmDescription}` : ''}。\n所有生成的事件描述必须与【${realmName}】这个秘境的特点紧密关联！`
          : '';

        typeInstructions = `
            玩家正在【秘境】中探索${riskText}。${realmContext}
            当前境界：${player.realm} (第 ${player.realmLevel} 层)

            【秘境环境特点】
            秘境是独立于外界的小世界，环境奇特诡异，充满未知的危险和机遇。

            ${realmName ? `\n【关键要求 - 必须严格遵守】\n你生成的事件描述必须完全符合【${realmName}】这个秘境的特点和环境！\n- 如果秘境名称包含"山脉"、"万兽"，描述应该涉及山林、妖兽等\n- 如果秘境名称包含"剑冢"、"剑"，描述应该涉及剑、剑意、剑修遗迹等\n- 如果秘境名称包含"雷"、"雷罚"，描述应该涉及雷电、雷霆等\n- 如果秘境名称包含"幽冥"、"九幽"、"深渊"，描述应该涉及阴气、鬼物、黑暗等\n- 如果秘境名称包含"火"、"熔岩"、"天火"，描述应该涉及火焰、岩浆等\n- 如果秘境名称包含"冰"、"雪域"、"冰封"，描述应该涉及冰雪、寒冷等\n- 如果秘境名称包含"毒"、"毒瘴"，描述应该涉及毒气、毒物等\n- 如果秘境名称包含"幻境"、"迷窟"，描述应该涉及幻象、迷宫等\n- 如果秘境名称包含"血海"、"魔渊"，描述应该涉及魔气、邪物等\n- 如果秘境名称包含"星辰"、"遗迹"，描述应该涉及星辰、古代遗迹等\n- 如果秘境名称包含"龙族"、"古墓"，描述应该涉及龙族、墓葬等\n- 如果秘境名称包含"仙灵"，描述应该涉及仙气、灵物等\n- 如果秘境名称包含"天劫"、"雷池"，描述应该涉及天劫、雷池等\n- 如果秘境名称包含"混沌"、"虚空"，描述应该涉及空间、混乱等\n- 如果秘境名称包含"时光"、"裂缝"，描述应该涉及时间、时空等\n- 如果秘境名称包含"死亡"、"峡谷"，描述应该涉及死亡、峡谷等\n- 如果秘境名称包含"神魔"、"战场"，描述应该涉及战斗、战场等\n\n绝对不能生成与秘境名称无关的通用描述！所有场景、环境、事件都必须紧扣秘境名称和特点！` : ''}

            【秘境场景类型（必须多样化）】
            - 古老遗迹：如"残破的古城"、"废弃的仙府"、"被掩埋的神庙"等
            - 奇异地形：如"悬浮的岛屿"、"倒流的瀑布"、"扭曲的空间"等
            - 神秘禁地：如"被封印的祭坛"、"血色的洞窟"、"星辰空间"等
            - 自然奇观：如"灵泉深处"、"地火熔岩"、"寒冰秘境"、"雷电领域"等

            【风险等级对应的场景氛围】
            - 低风险：环境相对安全，但仍有守护者或陷阱
              * 如"一处被岁月侵蚀的古修士洞府，虽然残破但结构完整"
              * 如"一片奇异的药园，里面长满了各种珍稀灵草，但有一只小妖兽守护"
            - 中风险：环境开始变得危险，需要小心应对
              * 如"一座被黑雾笼罩的废墟，四周传来诡异的低语"
              * 如"一处地下的迷宫，石壁上刻满了古老的禁制符文"
            - 高风险：环境极其危险，随时可能遭遇致命威胁
              * 如"一座被血红色光芒笼罩的祭坛，空气中弥漫着杀机"
              * 如"一处被空间裂缝撕裂的异空间，四周不断有虚空风暴刮过"
            - 极度危险：环境极度恶劣，随时可能丧命
              * 如"一处被上古大阵笼罩的绝地，每一步都可能触发致命的禁制"
              * 如"一座漂浮在虚空中的古老神殿，四周是无尽的黑暗和混沌"

            【秘境事件类型】
            1. 遭遇强大的守护妖兽/魔物（战斗，高伤害高风险高回报）
            2. 发现外界绝迹的宝物（如"仙草"、"古法宝"、"失传功法"等）
            3. 触发古老的机关陷阱（受伤但可能获得宝物）
            4. 发现隐藏的宝库或传承（获得丰厚奖励）
            5. 遭遇秘境中的其他修士（可能是敌是友）
            6. 发现秘境的秘密或解开谜题（获得特殊奖励）
            7. 遭遇空间裂缝或时空乱流（危险但可能获得机缘）

            【秘境描述要求】
            - 必须详细描述秘境的环境：如古老的气息、奇异的景象、危险的氛围等
            - 必须描述玩家的探索过程：如"你小心翼翼地深入"、"你御剑飞行穿过"等
            - 必须描述具体的事件：如妖兽的外貌、宝物的外观、陷阱的表现等
            - 根据风险等级，场景应该越来越危险和诡异
            - 每次进入秘境都应该有不同的场景描述，避免重复

            【示例场景描述】
            - "你踏入一处被紫色雾气笼罩的古老遗迹。残破的石柱上刻满了无法辨认的符文，地面布满了岁月的痕迹。突然，一只巨大的石像守卫从阴影中苏醒，眼中闪烁着幽蓝的光芒，向你发起了攻击。"
            - "在一片扭曲的空间中，你发现了一座悬浮的岛屿。岛屿上生长着从未见过的奇异植物，空气中弥漫着浓郁的灵气。在岛屿中心，你找到了一处被阵法守护的宝库。"
            - "你穿越一道空间裂缝，进入了一处被血红色光芒笼罩的祭坛。祭坛上摆放着各种奇异的祭品，空气中弥漫着令人心悸的威压。突然，一头巨大的魔物从祭坛后现身，向你发起了致命的攻击。"

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
          12. 极小概率获得传承(获得传承,可以直接突破1-4个境界)
          14. 【危险】遭遇邪修或魔修（可能受伤、被抢走灵石、修为降低）
          15. 【危险】触发陷阱（可能受伤、属性降低、修为降低）
          16. 【特殊】触发随机秘境（进入秘境后触发新的随机事件，风险和收益都更高）

          危险事件概率：约15-20%的概率遭遇危险事件（邪修、魔修、陷阱）
          随机秘境概率：约5%的概率触发随机秘境
          大部分时间是普通事件，小概率出现危险或惊喜。
          物品稀有度：${Math.max(0, 60 - realmIndex * 10)}%普通，${Math.min(30 + realmIndex * 5, 50)}%稀有，${Math.min(realmIndex * 3, 20)}%传说。
          修为奖励：${Math.floor(10 * realmMultiplier)}-${Math.floor(100 * realmMultiplier)}，灵石奖励：${Math.floor(5 * realmMultiplier)}-${Math.floor(50 * realmMultiplier)}。
          传承奖励：${Math.floor(1 * realmMultiplier)}-${Math.floor(4 * realmMultiplier)}。
          注意：抽奖券奖励已改为本地概率判定，AI不需要返回lotteryTicketsChange字段。

          【场景描述多样化要求（非常重要）】
          每次历练的场景描述必须不同，避免单调重复。描述应该生动详细，包含环境、动作、事件细节。

          【环境描写示例】
          - 地点多样化：如"幽深的山谷"、"古老的森林"、"云雾缭绕的悬崖"、"荒凉的废墟"、"神秘的洞府"、"星空下的平原"、"险峻的峡谷"、"湍急的瀑布"、"幽暗的洞穴"、"花海深处"等
          - 氛围多样化：如"阴风阵阵"、"灵气氤氲"、"杀机四伏"、"霞光万丈"、"死气沉沉"、"生机勃勃"、"寒气逼人"、"热浪滚滚"等
          - 时间多样化：如"月黑风高"、"晨曦初照"、"雷雨交加"、"夕阳西下"、"夜半时分"、"正午烈日"、"黄昏时分"等

          【动作描写多样化】
          - 探索类："你小心翼翼地探索"、"你御剑飞行穿过"、"你缓缓前行"、"你加快脚步"等
          - 发现类："你的神识突然感知到"、"你偶然发现"、"你注意到"、"你循声而去"等
          - 战斗类："你拔剑迎战"、"你运转功法"、"你祭出法宝"、"你施展神通"等

          【事件描述多样化示例】
          - "你在一处幽深的山谷中发现了一株千年灵芝，它散发着淡淡的药香，周围还生长着一些罕见的灵草。"
          - "漫步在古老的森林中，你的神识突然感知到一股异常的灵气波动。你小心翼翼地靠近，发现一块奇异的灵石静静躺在石缝中。"
          - "在一片桃花林深处，你发现了一座被藤蔓遮掩的古老石碑。拂去尘埃，石碑下竟然埋藏着一个精致的玉盒。"
          - "月黑风高，你御剑穿过一片荒凉的废墟。突然，一头三目妖狼从阴影中扑出，双目猩红，獠牙外露。"

          【重要】每次生成的事件描述必须包含：
          1. 具体的地点环境描述（至少10-30字）
          2. 玩家的具体行动描述（至少10-20字）
          3. 事件的具体细节描述（至少20-50字）
          4. 尽量包含玩家的感受或观察（可选但推荐）

          避免使用过于简单的描述，如"你遇到了一头妖兽"、"你发现了一株灵草"等。
          应该使用丰富的场景描写，如"你在一处被紫色雾气笼罩的古老遗迹中，听到远处传来低沉的咆哮声。你小心翼翼地靠近，发现一头身披鳞甲的妖熊正在与另一只妖兽搏斗，四周布满了战斗的痕迹..."

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

      【场景描述多样化要求（极其重要 - 必须严格遵守）】
      事件描述（story）必须生动详细，包含丰富的场景细节，避免单调重复。每次生成都应该有独特的场景和描述。

      【描述结构要求（必须包含所有部分）】
      1. 环境描写（必选，10-40字）：描述所在的具体环境和氛围
         - 地点多样化：如"幽深的山谷"、"古老的森林"、"云雾缭绕的悬崖"、"荒凉的废墟"、"神秘的洞府"、"星空下的平原"、"险峻的峡谷"、"湍急的瀑布"、"幽暗的洞穴"、"花海深处"、"古战场遗迹"、"仙灵湖泊"等
         - 氛围多样化：如"阴风阵阵"、"灵气氤氲"、"杀机四伏"、"霞光万丈"、"死气沉沉"、"生机勃勃"、"寒气逼人"、"热浪滚滚"、"雷电交加"、"血光冲天"等
         - 天气/时间多样化：如"月黑风高"、"晨曦初照"、"雷雨交加"、"夕阳西下"、"夜半时分"、"正午烈日"、"黄昏时分"、"雪花飘落"等

      2. 动作描写（必选，10-30字）：描述玩家的具体行动和反应
         - 探索类："你小心翼翼地探索"、"你御剑飞行穿过"、"你缓缓前行"、"你加快脚步"、"你屏息凝神地观察"等
         - 发现类："你的神识突然感知到"、"你偶然发现"、"你注意到"、"你循声而去"、"你驻足观察"等
         - 战斗类："你拔剑迎战"、"你运转功法"、"你祭出法宝"、"你施展神通"、"你严阵以待"等
         - 反应类："你心中一紧"、"你神色凝重"、"你面露喜色"、"你暗自警惕"等

      3. 事件细节（必选，30-80字）：描述具体发生的事情，包含详细的视觉、听觉、嗅觉等感官细节
         - 妖兽/敌人：外貌特征（如"三目妖狼"、"身披鳞甲"、"双目猩红"、"獠牙外露"、"眼中闪烁着幽绿的光芒"等）
         - 物品/宝物：外观描述（如"散发着淡淡的药香"、"散发着五彩光芒"、"古朴的长剑"、"精致的玉盒"等）
         - 环境变化：如"石门缓缓打开"、"剑气从四面八方袭来"、"地面突然裂开"、"天空中降下霞光"等
         - 对话/声音：如"远处传来咆哮声"、"诡异的笑声和低语"、"沉重的脚步声"等

      4. 感受描写（强烈推荐，10-30字）：描述玩家的感受和体验
         - 如"你感受到一股强大的威压"、"灵气涌入体内"、"心中警兆大起"、"你感受到前所未有的危机感"等

      【场景多样化模板示例（参考这些风格，但每次都要变化）】

      【战斗类场景模板】
      - "月黑风高，你御剑穿过一片荒凉的废墟。残破的石柱在月光下投下诡异的阴影，空气中弥漫着腐朽的气息。突然，一头三目妖狼从阴影中扑出，双目猩红，獠牙外露，身上散发着浓烈的妖气。你立即拔剑迎战，剑光与妖气交织，战斗异常激烈。最终，你将其斩杀，却也耗去不少气血。"
      - "在一片古老的森林深处，参天古树遮天蔽日，你听到远处传来低沉的咆哮声。你循声而去，发现一头筑基期的铁甲熊正在与另一只妖兽搏斗，四周树木倒伏，地面坑洼。你趁其不备，突袭斩杀，获得了意外的收获。"
      - "你在一处险峻的峡谷中前行，两侧是陡峭的悬崖。突然，一群魔化妖兽从崖壁上跃下，它们眼中闪烁着幽绿的邪光，身上散发着令人作呕的魔气。你立即运转功法，与它们展开了激烈的战斗。经过一番苦战，你终于将它们全部斩杀。"

      【发现物品类场景模板】
      - "你在一处灵气氤氲的山谷中发现了一座废弃的洞府。山谷中长满了奇花异草，空气中弥漫着淡淡的药香。推开洞府的石门，里面布满了灰尘和蛛网，显然已经很久没有人来过了。在洞府深处，你找到了一株千年灵芝，它散发着柔和的光芒，周围还生长着一些罕见的灵草。"
      - "漫步在一处荒芜的山脉，你正感到有些无聊，突然你的神识感知到一股异常的灵气波动。你小心翼翼地靠近，发现一块奇异的灵石静静躺在石缝中，它散发着五彩光芒，显然不是凡物。你将其取出，感受到其中蕴含的浓郁灵气。"
      - "在一片桃花林深处，粉色的花瓣随风飘落，宛如仙境。你发现了一座被藤蔓遮掩的古老石碑，石碑上刻满了无法辨认的古文。你拂去尘埃，发现石碑下竟然埋藏着一个精致的玉盒。打开一看，里面是一把古朴的长剑，剑身上刻着神秘的符文。"

      【奇遇类场景模板】
      - "你在修炼时，天空中突然乌云密布，雷电交加。一道紫色霞光从天而降，将你笼罩其中。你感受到一股强大的大道之力涌入体内，经脉中的灵气瞬间暴涨，修为瞬间精进。"
      - "在一处悬崖边，你正在打坐调息，突然听到身后传来脚步声。转身一看，是一位白须老者，他仙风道骨，眼中透着智慧的光芒。他看你资质不错，便传授了你一套失传已久的功法，并给了你一些珍贵的丹药。"
      - "你误入一处上古遗迹，里面布满了古老的阵法和禁制。墙壁上刻满了看不懂的符文，散发着古老而神秘的气息。经过一番探索，你解开了一个小型阵法，获得了其中封印的一件宝物。"

      【危险类场景模板】
      - "你在一处偏僻的山谷中突然感觉到杀机四伏，四周的草木似乎都在颤抖。来不及反应，一群邪修从四周包围了你，他们身穿黑袍，面露贪婪之色，眼中闪烁着凶光，显然是看上了你身上的宝物。你拼尽全力，施展全力才得以逃脱。"
      - "你踏入一处看似平静的洞府，洞府内光线昏暗，四周静悄悄的。然而，当你走到洞府中央时，突然触发了古老的陷阱。无数道剑气从四面八方袭来，发出尖锐的破空声。你虽然勉强躲过，但也受了不轻的伤。"
      - "在一片迷雾中，你迷失了方向。四周白茫茫一片，能见度极低。更诡异的是，迷雾中不断传来诡异的笑声和低语，声音忽远忽近，让你心神不宁。你强行运转功法，护住心神，才从这诡异的环境中脱身，但修为略有损耗。"

      【重要约束】
      1. 事件描述（story）必须符合玩家当前境界，使用修仙风格的中文描述，长度控制在50-200字
      2. 每次生成的场景描述必须不同，避免使用相同的模板或句式
      3. 描述应该包含环境、动作、事件细节，推荐包含感受描写
      4. 根据事件类型选择合适的场景模板，但要在模板基础上进行创新和变化
      5. 所有数值必须合理：气血变化不应超过玩家最大气血的50%，修为和灵石变化应符合境界水平
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

    const resultText = await requestModel(
      [
        {
          role: 'system',
          content:
            '你是一名严谨的修仙游戏GM，需要严格按照用户要求返回结构化数据。\n\n重要规则：\n1. 只返回JSON格式，不要有任何额外的文字说明、解释或描述\n2. 不要使用代码块标记（如```json```），直接返回纯JSON\n3. 所有数字值必须是纯数字格式，例如 "spirit": 8 而不是 "spirit": +8\n4. 不要添加任何注释或说明文字\n5. 确保JSON格式完全正确，可以被直接解析\n6. 禁止输出 null/undefined 或空字符串字段；缺失字段请直接省略\n7. 禁止重复使用相同的模板或开头句式（如“你在”），连续结果必须改写\n8. eventColor 必须匹配事件性质：danger=有损失，gain=正收益，special=罕见大机缘/秘境/传承，normal=轻描淡写或无明显收益\n9. 所有 effect 数值必须落在稀有度对应区间，否则重写\n10. hpChange 必须与描述伤害/治疗匹配，且绝对值不超过玩家最大气血的50%（向下取整）\n11. 同一输出中 equipmentSlot 不得冲突（戒指/首饰自动分配除外）\n12. attributeReduction 仅能出现在极度危险事件，且必须伴随稀有及以上奖励补偿',
        },
        {
          role: 'user',
          content: `${prompt}

【输出要求】
只返回JSON格式，不要有任何额外的文字、说明、解释或描述。不要使用代码块标记，直接返回纯JSON。
不要输出 null/undefined/空字符串字段，缺失字段直接省略。

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
11. 秘境名称或描述存在时，故事中至少出现2个与其直接相关的名词/现象；缺失时使用通用秘境风格
12. items/itemsObtained 中的装备槽位不得重复（戒指/首饰可重复自动分配）；多件物品时至少包含1件稀有或以上
13. 物品名称在描述与 item(s) 中必须一致，战斗掉落的材料需体现在 items 中
14. 避免固定句式：不要让超过30%的事件以相同短语开头（如“你在”“你正”）；需要改写
15. hpChange 范围需符合描述且限制在 [-maxHp*0.5, maxHp*0.5]（向下取整）

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
