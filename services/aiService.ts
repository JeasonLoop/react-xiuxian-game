
/// <reference types="vite/client" />

import { PlayerStats, AdventureResult, AdventureType } from "../types";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

const DEFAULT_API_URL = "api/v1/chat/completions";
const DEFAULT_MODEL = "4.0Ultra";
const DEFAULT_API_KEY = "NtHLeNRgfHfgEdkcmpiE:MhomOCjynnmScJDHDBIX";

const API_URL = import.meta.env.VITE_AI_API_URL || DEFAULT_API_URL;
const API_MODEL = import.meta.env.VITE_AI_MODEL || DEFAULT_MODEL;
const API_KEY = import.meta.env.VITE_AI_API_KEY || DEFAULT_API_KEY;

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

    switch (adventureType) {
      case 'lucky':
        typeInstructions = `
          这是一次【大机缘】事件！
          玩家运气爆棚。请生成一个极其罕见的正面事件。
          例如：发现上古大能遗府、顿悟大道、获得传说级/仙品法宝或大量灵石。
          事件颜色应为 "special"。
          物品稀有度必须是 "传说" 或 "仙品"。
          收益应当非常丰厚。
        `;
        break;
      case 'secret_realm':
        typeInstructions = `
          玩家正在【秘境】中探索。
          环境险恶，但回报丰厚。
          可能遭遇强大的守护妖兽（高伤害风险）或发现外界绝迹的宝物。
          如果发生战斗，伤害和奖励都应比平时更高。
          物品稀有度较高（至少是"稀有"，有几率"传说"）。
        `;
        break;
      default:
        typeInstructions = `
          这是玩家在修仙界的一次普通日常历练。
          可能性：遭遇妖兽、发现草药、遇到路人等。
          大部分时间是普通事件，小概率出现危险或惊喜。
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
          content: "你是一名严谨的修仙游戏GM，需要严格按照用户要求返回结构化数据。",
        },
        {
          role: "user",
          content: `${prompt}
请以 JSON 格式输出，字段为 story(字符串)、hpChange(整数)、expChange(整数)、spiritStonesChange(整数)、eventColor(字符串: normal/gain/danger/special)、itemObtained(可以为 null 或包含 name/type/description/rarity/isEquippable/effect 对象)`,
        },
      ],
      0.95
    );

    return JSON.parse(resultText) as AdventureResult;

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
