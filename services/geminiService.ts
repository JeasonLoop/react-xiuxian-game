
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { PlayerStats, AdventureResult, AdventureType } from "../types";

const apiKey = process.env.API_KEY || '';
// Initialize lazily to avoid errors if key is missing during initial render outside of usage
const getAI = () => new GoogleGenAI({ apiKey });

const adventureSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    story: { type: Type.STRING, description: "事件的生动简短描述（2-3句话）。使用武侠/仙侠术语。" },
    hpChange: { type: Type.INTEGER, description: "受到的伤害为负数，治疗为正数。" },
    expChange: { type: Type.INTEGER, description: "获得的修为经验（或损失）。" },
    spiritStonesChange: { type: Type.INTEGER, description: "发现或丢失的灵石数量。" },
    eventColor: { type: Type.STRING, enum: ["normal", "gain", "danger", "special"], description: "事件的基调颜色。" },
    itemObtained: {
      type: Type.OBJECT,
      nullable: true,
      properties: {
        name: { type: Type.STRING },
        type: { type: Type.STRING, enum: ["草药", "材料", "法宝", "丹药"] },
        description: { type: Type.STRING },
        rarity: { type: Type.STRING, enum: ["普通", "稀有", "传说", "仙品"], description: "物品的稀有度" },
        isEquippable: { type: Type.BOOLEAN },
        effect: {
          type: Type.OBJECT,
          properties: {
            attack: { type: Type.INTEGER },
            defense: { type: Type.INTEGER },
            hp: { type: Type.INTEGER },
            exp: { type: Type.INTEGER }
          }
        }
      }
    }
  },
  required: ["story", "hpChange", "expChange", "spiritStonesChange", "eventColor"]
};

export const generateAdventureEvent = async (player: PlayerStats, adventureType: AdventureType = 'normal'): Promise<AdventureResult> => {
  if (!apiKey) {
    return {
      story: "你静心打坐，四周一片寂静。（API Key 缺失，AI 功能已禁用）",
      hpChange: 5,
      expChange: 10,
      spiritStonesChange: 0,
      eventColor: 'normal'
    };
  }

  try {
    const ai = getAI();
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

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: adventureSchema,
        temperature: 0.95, 
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("No response from AI");
    
    return JSON.parse(resultText) as AdventureResult;

  } catch (error) {
    console.error("Gemini Error:", error);
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
  if (!apiKey) return success ? "突破成功！" : "突破失败！";

  try {
    const ai = getAI();
    const prompt = `
      描述一名修仙者尝试突破到 ${realm} 的过程。
      结果：${success ? "成功" : "失败"}。
      请保持简短（不超过2句话），使用玄幻、仙侠风格，提及灵气涌动、经脉或天劫等元素。
      请使用中文输出。
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text || (success ? "天地震动，你成功突破瓶颈！" : "你气血翻涌，突破失败了。");
  } catch (e) {
    return success ? "突破成功！" : "突破失败！";
  }
};
