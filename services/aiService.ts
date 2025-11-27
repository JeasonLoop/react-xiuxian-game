
/// <reference types="vite/client" />

import { PlayerStats, AdventureResult, AdventureType } from "../types";
import { REALM_ORDER } from "../constants";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

// 强制使用代理路径，避免跨域问题
// 开发环境通过 Vite proxy，生产环境通过 Vercel Function
const DEFAULT_API_URL = "https://api.siliconflow.cn/v1/chat/completions";
const DEFAULT_MODEL = "Qwen/Qwen2.5-72B-Instruct";
const DEFAULT_API_KEY = "sk-hmldnzdfarkzmvvnzqxasgaqdznjpjfvxyqczpmifbmwtqda";

// 强制使用代理 URL，忽略环境变量（避免 Vercel 环境变量覆盖）
const API_URL = DEFAULT_API_URL;
const API_MODEL = import.meta.env.VITE_AI_MODEL || DEFAULT_MODEL;
const API_KEY = import.meta.env.VITE_AI_KEY || DEFAULT_API_KEY;

const stripCodeFence = (text: string): string => {
  let output = text.trim();
  if (output.startsWith("```")) {
    output = output.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  }
  if (output.toLowerCase().startsWith("json")) {
    output = output.slice(4).trim();
  }
  return output;
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
          content: "你是一名严谨的修仙游戏GM，需要严格按照用户要求返回结构化数据。返回的JSON中，所有数字值必须是纯数字，不要带+号或其他符号。",
        },
        {
          role: "user",
          content: `${prompt}
请以 JSON 格式输出，字段为：
- story(字符串): 事件描述
- hpChange(整数): 气血变化（纯数字，不要带+号，可以是负数）
- expChange(整数): 修为变化（纯数字，不要带+号，可以是负数，遭遇危险时可能降低）
- spiritStonesChange(整数): 灵石变化（纯数字，不要带+号，可以是负数，被抢时可能为负数）
- lotteryTicketsChange(整数，可选): 抽奖券变化（如果获得抽奖券，纯数字）
- inheritanceLevelChange(整数1-4，可选): 传承等级变化（极小概率获得传承，可直接突破1-4个境界，纯数字）
- attributeReduction(对象，可选): 属性降低（遭遇陷阱、邪修等危险事件时，包含attack/defense/spirit/physique/speed/maxHp字段，所有数字值必须是纯数字）
- triggerSecretRealm(布尔值，可选): 是否触发随机秘境（如果为true，玩家将进入秘境并触发新的随机事件）
- eventColor(字符串: normal/gain/danger/special): 事件颜色（危险事件应为"danger"，秘境事件应为"special"）
- itemObtained(可以为 null 或包含 name/type/description/rarity/isEquippable/equipmentSlot/effect/permanentEffect 对象): 获得的物品
  - type(字符串): 物品类型，必须是以下之一：草药、丹药、材料、法宝、武器、护甲、首饰、戒指
  - isEquippable(布尔值): 是否可装备（如果是装备类物品，必须为true）
  - equipmentSlot(字符串，可选): 装备槽位，如果是装备类物品，必须指定。可选值：头部、肩部、胸甲、手套、裤腿、鞋子、戒指1、戒指2、戒指3、戒指4、首饰1、首饰2、法宝1、法宝2、武器
  - effect: 临时效果对象，包含 hp/exp/attack/defense/spirit/physique/speed 等字段（所有数字值必须是纯数字，不要带+号）
  - permanentEffect: 永久效果对象，包含 attack/defense/spirit/physique/speed/maxHp 等字段（所有数字值必须是纯数字，不要带+号）

重要规则：
1. 所有数字值必须是纯数字格式，例如 "spirit": 8 而不是 "spirit": +8
2. 装备类物品（武器、护甲、首饰、戒指、法宝）必须设置 isEquippable: true 和正确的 equipmentSlot
3. 物品类型必须严格使用：草药、丹药、材料、法宝、武器、护甲、首饰、戒指（不要使用"防具"等非标准类型）
4. 根据物品名称和描述合理推断装备槽位：
   - 剑、刀、枪、戟等武器 → type: "武器", equipmentSlot: "武器"
   - 裘、披风、肩甲、护肩等 → type: "护甲", equipmentSlot: "肩部"
   - 道袍、法衣、胸甲等 → type: "护甲", equipmentSlot: "胸甲"
   - 头盔、冠、帽等 → type: "护甲", equipmentSlot: "头部"
   - 手套、护手等 → type: "护甲", equipmentSlot: "手套"
   - 靴、鞋等 → type: "护甲", equipmentSlot: "鞋子"
   - 戒指 → type: "戒指", equipmentSlot: "戒指1"或"戒指2"等
   - 项链、玉佩、手镯等 → type: "首饰", equipmentSlot: "首饰1"或"首饰2"
   - 法宝类 → type: "法宝", equipmentSlot: "法宝1"或"法宝2"
5. 法宝（type: "法宝"）必须提供属性加成，不能提供exp（修为）加成：
   - 法宝必须设置effect对象，包含以下至少一种属性：attack（攻击）、defense（防御）、hp（气血）、spirit（神识）、physique（体魄）、speed（速度）
   - 法宝绝对不能设置effect.exp（修为加成），法宝是装备类物品，提供的是个人属性加成，不是修为加成
   - 根据法宝的稀有度和描述，合理设置属性加成数值`,
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
