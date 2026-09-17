/**
 * 灵兽苑 · 灵兽远征常量与地点配置
 */
import { Item, ItemType } from '../types';
import { createReforgeStoneItem } from './tower';
import { getItemFromConstants } from '../utils/itemConstantsUtils';
import { uid } from '../utils/gameUtils';

export interface ExpeditionLocationConfig {
  id: string;
  name: string;
  minPetLevel: number;
  durationMs: number;
  durationLabel: string;
  dangerLevel: '普通' | '危险' | '绝凶';
  description: string;
  lootPreview: string[];
  generateRewards: (petLevel: number) => {
    spiritStones: number;
    exp: number;
    items: Item[];
  };
}

export const EXPEDITION_LOCATIONS: ExpeditionLocationConfig[] = [
  {
    id: 'ten-thousand-mountains',
    name: '十万大山外围',
    minPetLevel: 1,
    durationMs: 30 * 60 * 1000, // 30分钟
    durationLabel: '30分钟',
    dangerLevel: '普通',
    description: '古木参天，灵禽栖息。适合初出茅庐的灵兽漫游采撷草木与灵矿。',
    lootPreview: ['大量灵石', '凝血草/聚灵草', '强化石', '灵兽历练心得'],
    generateRewards: (petLevel: number) => {
      const spiritStones = Math.floor(800 + Math.random() * 800 + petLevel * 50);
      const exp = Math.floor(1200 + Math.random() * 1000 + petLevel * 80);
      const items: Item[] = [];

      // 灵草
      const herbCandidate = Math.random() < 0.5 ? '聚灵草' : '凝血草';
      const herbDef = getItemFromConstants(herbCandidate);
      if (herbDef) {
        items.push({
          ...(herbDef as unknown as Item),
          id: uid(),
          quantity: Math.floor(Math.random() * 3) + 1,
        });
      }

      // 强化石
      if (Math.random() < 0.6) {
        const stoneDef = getItemFromConstants('强化石') || {
          id: uid(),
          name: '强化石',
          type: ItemType.Material,
          rarity: '稀有',
          description: '用于强化法宝的珍贵材料。',
          quantity: 1,
        };
        items.push({
          ...(stoneDef as unknown as Item),
          id: uid(),
          quantity: 1,
        });
      }

      return { spiritStones, exp, items };
    },
  },
  {
    id: 'east-sea-dragon-abyss',
    name: '东海潜龙深渊',
    minPetLevel: 15,
    durationMs: 2 * 60 * 60 * 1000, // 2小时
    durationLabel: '2小时',
    dangerLevel: '危险',
    description: '海眼深邃，暗礁潜龙。灵兽可下潜探索远古沉船与深海秘矿。',
    lootPreview: ['海量灵石', '龙鳞果/紫猴花', '太虚洗炼石', '高阶妖丹'],
    generateRewards: (petLevel: number) => {
      const spiritStones = Math.floor(3500 + Math.random() * 2500 + petLevel * 100);
      const exp = Math.floor(6000 + Math.random() * 4000 + petLevel * 150);
      const items: Item[] = [];

      // 洗炼石必定获得 1~2 颗
      const reforgeQty = Math.random() < 0.35 ? 2 : 1;
      items.push({ ...createReforgeStoneItem(reforgeQty), id: uid() });

      // 稀有材料/草药
      const herb = getItemFromConstants('紫猴花') || getItemFromConstants('龙鳞果');
      if (herb) {
        items.push({
          ...(herb as unknown as Item),
          id: uid(),
          quantity: Math.floor(Math.random() * 2) + 1,
        });
      }

      // 妖丹
      if (Math.random() < 0.5) {
        const core = getItemFromConstants('高阶妖丹');
        if (core) {
          items.push({ ...(core as unknown as Item), id: uid(), quantity: 1 });
        }
      }

      return { spiritStones, exp, items };
    },
  },
  {
    id: 'meteor-forbidden-zone',
    name: '太虚陨星禁地',
    minPetLevel: 30,
    durationMs: 4 * 60 * 60 * 1000, // 4小时
    durationLabel: '4小时',
    dangerLevel: '绝凶',
    description: '虚空裂隙中天火流坠，危机四伏，唯有通灵道行的灵兽方能踏足。',
    lootPreview: ['磅礴灵石', '太虚洗炼石x2~4', '九转金丹/天元丹', '天外陨铁/万年灵乳'],
    generateRewards: (petLevel: number) => {
      const spiritStones = Math.floor(10000 + Math.random() * 8000 + petLevel * 200);
      const exp = Math.floor(20000 + Math.random() * 15000 + petLevel * 300);
      const items: Item[] = [];

      // 洗炼石 2~4 颗
      const reforgeQty = Math.floor(Math.random() * 3) + 2;
      items.push({ ...createReforgeStoneItem(reforgeQty), id: uid() });

      // 极品仙丹或珍材
      const rareItems = ['天外陨铁', '万年灵乳', '九转金丹', '天元丹'];
      const pick = rareItems[Math.floor(Math.random() * rareItems.length)];
      const found = getItemFromConstants(pick);
      if (found) {
        items.push({ ...(found as unknown as Item), id: uid(), quantity: 1 });
      }

      return { spiritStones, exp, items };
    },
  },
];

/** 根据洞府等级计算解锁的灵兽远征槽位数 */
export function getUnlockedExpeditionSlots(grottoLevel = 0): number {
  if (grottoLevel >= 9) return 4;
  if (grottoLevel >= 6) return 3;
  if (grottoLevel >= 3) return 2;
  return 1;
}
