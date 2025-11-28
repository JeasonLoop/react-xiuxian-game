
/// <reference types="vite/client" />

import { PlayerStats, AdventureResult, AdventureType, RealmType } from "../types";
import { REALM_ORDER } from "../constants";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

// AI 配置从环境变量读取（.env.local）
// 开发环境通过 Vite proxy，生产环境通过 Vercel Function
const DEFAULT_API_URL = "https://api.siliconflow.cn/v1/chat/completions";
const DEFAULT_MODEL = "Qwen/Qwen2.5-72B-Instruct";
const DEFAULT_API_KEY = "";

// 从环境变量读取配置，如果不存在则使用默认值
const API_URL = import.meta.env.VITE_AI_API_URL || DEFAULT_API_URL;
const API_MODEL = import.meta.env.VITE_AI_MODEL || DEFAULT_MODEL;
const API_KEY = import.meta.env.VITE_AI_KEY || DEFAULT_API_KEY;

const stripCodeFence = (text: string): string => {
  let output = text.trim();

  // 移除代码块标记
  if (output.startsWith("```")) {
    output = output.replace(/^```(?:json|JSON)?/i, "").replace(/```$/i, "").trim();
  }
  if (output.toLowerCase().startsWith("json")) {
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
  if (typeof content === "string") {
    return stripCodeFence(content);
  }
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (typeof part === "object" && part !== null && "text" in part) {
          return (part as { text?: string }).text || "";
        }
        return "";
      })
      .join("");
  }
  return "";
};

const requestSpark = async (messages: ChatMessage[], temperature = 0.8) => {
  if (!API_KEY) {
    throw new Error("AI API key is missing");
  }

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
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
    throw new Error("Spark API returned empty content");
  }

  return content;
};

export const generateAdventureEvent = async (player: PlayerStats, adventureType: AdventureType = 'normal'): Promise<AdventureResult> => {
  if (!API_KEY) {
    return {
      story: "你静心打坐，四周一片寂静。（API Key 缺失，AI 功能已禁用）",
      hpChange: 5,
      expChange: 10,
      spiritStonesChange: 0,
      eventColor: 'normal'
    };
  }

  try {
    let typeInstructions = "";

    // 根据境界调整事件类型和奖励
    const realmIndex = REALM_ORDER.indexOf(player.realm);
    const realmMultiplier = 1 + (realmIndex * 0.3) + ((player.realmLevel - 1) * 0.1);

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
        typeInstructions = `
          玩家正在【秘境】中探索。
          当前境界：${player.realm} (第 ${player.realmLevel} 层)

          环境险恶，但回报丰厚。可能遭遇强大的守护妖兽（高伤害风险）或发现外界绝迹的宝物。
          如果发生战斗，伤害和奖励都应比平时更高。
          物品稀有度：至少是"稀有"，有${Math.min(30 + realmIndex * 10, 70)}%几率"传说"，${Math.min(realmIndex * 5, 20)}%几率"仙品"。
          修为奖励：${Math.floor(50 * realmMultiplier)}-${Math.floor(500 * realmMultiplier)}，灵石奖励：${Math.floor(100 * realmMultiplier)}-${Math.floor(1000 * realmMultiplier)}。
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
          11. 运气好,捡到若干抽奖券(获得抽奖券)
          12. 极小概率获得传承(获得传承,可以直接突破1-4个境界)
          13. 【危险】遭遇邪修或魔修（可能受伤、被抢走灵石、修为降低）
          14. 【危险】触发陷阱（可能受伤、属性降低、修为降低）
          15. 【特殊】触发随机秘境（进入秘境后触发新的随机事件，风险和收益都更高）

          危险事件概率：约15-20%的概率遭遇危险事件（邪修、魔修、陷阱）
          随机秘境概率：约5%的概率触发随机秘境
          大部分时间是普通事件，小概率出现危险或惊喜。
          物品稀有度：${Math.max(0, 60 - realmIndex * 10)}%普通，${Math.min(30 + realmIndex * 5, 50)}%稀有，${Math.min(realmIndex * 3, 20)}%传说。
          修为奖励：${Math.floor(10 * realmMultiplier)}-${Math.floor(100 * realmMultiplier)}，灵石奖励：${Math.floor(5 * realmMultiplier)}-${Math.floor(50 * realmMultiplier)}。
          抽奖券奖励：${Math.floor(1 * realmMultiplier)}-${Math.floor(10 * realmMultiplier)}。
          传承奖励：${Math.floor(1 * realmMultiplier)}-${Math.floor(4 * realmMultiplier)}。
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

      请生成一个随机奇遇。
      ${typeInstructions}

      请严格以 JSON 格式返回结果。所有文本必须使用中文。
      如果获得物品，请设定合理的属性加成和稀有度。
    `;

    const resultText = await requestSpark(
      [
        {
          role: "system",
          content: "你是一名严谨的修仙游戏GM，需要严格按照用户要求返回结构化数据。\n\n重要规则：\n1. 只返回JSON格式，不要有任何额外的文字说明、解释或描述\n2. 不要使用代码块标记（如```json```），直接返回纯JSON\n3. 所有数字值必须是纯数字格式，例如 \"spirit\": 8 而不是 \"spirit\": +8\n4. 不要添加任何注释或说明文字\n5. 确保JSON格式完全正确，可以被直接解析",
        },
        {
          role: "user",
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
      "exp": 修为（整数，可选，纯数字）,
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
6. 根据物品名称推断装备槽位：剑/刀/枪→武器，道袍/胸甲→胸甲，头盔/冠→头部，戒指→戒指1-4，项链/玉佩→首饰1-2，法宝→法宝1-2`,
        },
      ],
      0.95
    );

    // 清理JSON字符串中的无效格式
    const cleanedJson = cleanJsonString(resultText);

    try {
      return JSON.parse(cleanedJson) as AdventureResult;
    } catch (parseError) {
      console.error("JSON解析失败，原始内容:", resultText);
      console.error("清理后的内容:", cleanedJson);
      console.error("解析错误:", parseError);
      throw new Error(`JSON解析失败: ${parseError}`);
    }

  } catch (error) {
    console.error("Spark Adventure Error:", error);
    // Fallback in case of API error
    return {
      story: "你在荒野中游荡了一番，可惜大道渺茫，此次一无所获。",
      hpChange: 0,
      expChange: 5,
      spiritStonesChange: 0,
      eventColor: 'normal'
    };
  }
};

export const generateBreakthroughFlavorText = async (realm: string, success: boolean): Promise<string> => {
  if (!API_KEY) return success ? "突破成功！" : "突破失败！";

  try {
    const prompt = `
      描述一名修仙者尝试突破到 ${realm} 的过程。
      结果：${success ? "成功" : "失败"}。
      请保持简短（不超过2句话），使用玄幻、仙侠风格，提及灵气涌动、经脉或天劫等元素。
      请使用中文输出。
    `;

    const content = await requestSpark(
      [
        {
          role: "system",
          content: "你是仙侠小说作家，擅长以唯美中文描绘修仙突破场景。",
        },
        { role: "user", content: prompt },
      ],
      0.8
    );

    return content.trim() || (success ? "天地震动，你成功突破瓶颈！" : "你气血翻涌，突破失败了。");
  } catch (e) {
    return success ? "突破成功！" : "突破失败！";
  }
};

export const generateEnemyName = async (realm: RealmType, adventureType: AdventureType): Promise<{ name: string; title: string }> => {
  if (!API_KEY) {
    // 如果API不可用，返回空对象，让调用者使用预设列表
    return { name: '', title: '' };
  }

  try {
    // RealmType 枚举的值已经是中文名称（如 '炼气期'、'筑基期'）
    const realmName = realm;

    const adventureContext = adventureType === 'secret_realm'
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
          role: "system",
          content: "你是修仙游戏的设计师，擅长创造符合仙侠风格的敌人名称。请严格返回JSON格式。",
        },
        { role: "user", content: prompt },
      ],
      0.9
    );

    const cleaned = stripCodeFence(content);
    const parsed = JSON.parse(cleaned);

    if (parsed.name && parsed.title) {
      return {
        name: parsed.name.trim(),
        title: parsed.title.trim()
      };
    }

    return { name: '', title: '' };
  } catch (e) {
    console.error("AI生成敌人名字失败:", e);
    return { name: '', title: '' };
  }
};