import { PlayerStats } from '../types';
import { FOUNDATION_TREASURES, HEAVEN_EARTH_ESSENCES, HEAVEN_EARTH_MARROWS, LONGEVITY_RULES, GOLDEN_CORE_METHOD_CONFIG, CULTIVATION_ARTS } from '../constants/index';

/**
 * 获取筑基奇物效果
 */
export function getFoundationTreasureEffects(treasureId?: string) {
  if (!treasureId) return {};
  const treasure = FOUNDATION_TREASURES[treasureId];
  return treasure ? treasure.effects : {};
}

/**
 * 获取天地精华效果
 */
export function getHeavenEarthEssenceEffects(essenceId?: string) {
  if (!essenceId) return {};
  const essence = HEAVEN_EARTH_ESSENCES[essenceId];
  return essence ? essence.effects : {};
}

/**
 * 获取天地之髓效果
 */
export function getHeavenEarthMarrowEffects(marrowId?: string) {
  if (!marrowId) return {};
  const marrow = HEAVEN_EARTH_MARROWS[marrowId];
  return marrow ? marrow.effects : {};
}

/**
 * 获取规则之力效果
 */
export function getLongevityRuleEffects(ruleIds: string[] = []) {
  const effects = {
    hpPercent: 0,
    attackPercent: 0,
    defensePercent: 0,
    spiritPercent: 0,
    physiquePercent: 0,
    speedPercent: 0,
    specialEffect: ''
  };

  ruleIds.forEach(ruleId => {
    const rule = LONGEVITY_RULES[ruleId];
    if (rule) {
      Object.keys(rule.effects).forEach(key => {
        if (key === 'specialEffect') {
          effects.specialEffect += rule.effects.specialEffect + '; ';
        } else if (key in effects && key in rule.effects) {
          // 使用类型安全的键访问，明确处理数字类型
          const effectKey = key as keyof typeof effects;
          const ruleEffectKey = key as keyof typeof rule.effects;

          // 确保只处理数字类型的属性
          if (effectKey !== 'specialEffect') {
            const effectValue = effects[effectKey] as number;
            const ruleValue = (rule.effects[ruleEffectKey] || 0) as number;
            (effects[effectKey] as number) = effectValue + ruleValue;
          }
        }
      });
    }
  });

  return effects;
}

/**
 * 数字转中文数字（支持1-999）
 */
export function numberToChinese(num: number): string {
  const chineseNums = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  const chineseUnits = ['', '十', '百', '千'];

  if (num === 0) return '零';
  if (num < 0) return '';
  if (num > 999) return String(num); // 超过999直接返回阿拉伯数字

  if (num < 10) {
    return chineseNums[num];
  }

  if (num < 20) {
    return num === 10 ? '十' : `十${chineseNums[num % 10]}`;
  }

  if (num < 100) {
    const tens = Math.floor(num / 10);
    const ones = num % 10;
    return `${chineseNums[tens]}十${ones > 0 ? chineseNums[ones] : ''}`;
  }

  if (num < 1000) {
    const hundreds = Math.floor(num / 100);
    const remainder = num % 100;
    const tens = Math.floor(remainder / 10);
    const ones = remainder % 10;

    let result = `${chineseNums[hundreds]}百`;
    if (remainder > 0) {
      if (tens === 0) {
        result += `零${chineseNums[ones]}`;
      } else {
        result += `${chineseNums[tens]}十${ones > 0 ? chineseNums[ones] : ''}`;
      }
    }
    return result;
  }

  return String(num);
}

/**
 * 计算金丹法数（只统计玄级及以上功法）
 */
export function calculateGoldenCoreMethodCount(player: PlayerStats): number {
  // 只统计玄级及以上的功法（玄、地、天）
  // 兼容旧存档：如果cultivationArts不存在或为空，返回0
  if (!player.cultivationArts || player.cultivationArts.length === 0) {
    return 0;
  }

  let count = 0;
  player.cultivationArts.forEach((artId) => {
    const art = CULTIVATION_ARTS.find((a) => a.id === artId);
    if (art && (art.grade === '玄' || art.grade === '地' || art.grade === '天')) {
      count++;
    }
  });

  return count; // 不设上限
}

/**
 * 获取金丹法数称号（使用中文数字）
 */
export function getGoldenCoreMethodTitle(methodCount: number): string {
  if (methodCount <= 0) return '未结丹';
  const chineseNum = numberToChinese(methodCount);
  return `${chineseNum}法金丹`;
}

/**
 * 计算金丹天劫难度倍数（支持任意法数）
 */
export function getGoldenCoreTribulationDifficulty(methodCount: number): number {
  if (methodCount <= 0) return 1.0;

  // 如果配置中有，直接使用
  if (methodCount <= 9 && GOLDEN_CORE_METHOD_CONFIG.methodDifficultyMultiplier[methodCount]) {
    return GOLDEN_CORE_METHOD_CONFIG.methodDifficultyMultiplier[methodCount];
  }

  // 大于9法金丹，使用公式计算：基础难度 + (法数-1) * 0.5
  // 9法金丹是5.0，10法开始是 5.0 + (10-9) * 0.5 = 5.5，以此类推
  if (methodCount > 9) {
    const base9Difficulty = GOLDEN_CORE_METHOD_CONFIG.methodDifficultyMultiplier[9] || 5.0;
    return base9Difficulty + (methodCount - 9) * 0.5;
  }

  return 1.0;
}

/**
 * 计算金丹属性加成倍数（支持任意法数）
 */
export function getGoldenCoreBonusMultiplier(methodCount: number): number {
  if (methodCount <= 0) return 1.0;

  // 如果配置中有，直接使用
  if (methodCount <= 9 && GOLDEN_CORE_METHOD_CONFIG.methodBonusMultiplier[methodCount]) {
    return GOLDEN_CORE_METHOD_CONFIG.methodBonusMultiplier[methodCount];
  }

  // 大于9法金丹，使用公式计算：9法金丹是4.6，10法开始是 4.6 + (10-9) * 0.1 = 4.7，但增长速度递减
  // 使用对数增长模式，让加成增长速度逐渐放缓
  if (methodCount > 9) {
    const base9Multiplier = GOLDEN_CORE_METHOD_CONFIG.methodBonusMultiplier[9] || 4.6;
    // 超过9法后，每增加1法，加成增加量递减：第10法+0.1，第11法+0.09，第12法+0.08...
    const extraMethods = methodCount - 9;
    let additionalBonus = 0;
    for (let i = 1; i <= extraMethods; i++) {
      additionalBonus += Math.max(0.05, 0.1 - (i - 1) * 0.01); // 最小增长0.05
    }
    return base9Multiplier + additionalBonus;
  }

  return 1.0;
}

/**
 * 检查晋升条件
 */
export function checkBreakthroughConditions(player: PlayerStats, targetRealm: string): {
  canBreakthrough: boolean;
  message: string;
} {
  // 筑基期检查
  if (targetRealm === '筑基期' && !player.foundationTreasure) {
    return {
      canBreakthrough: false,
      message: '筑基需要筑基奇物！你尚未获得筑基奇物，无法突破到筑基期。'
    };
  }

  // 金丹期检查：需要玄级以上功法
  if (targetRealm === '金丹期') {
    if (player.cultivationArts.length === 0) {
      return {
        canBreakthrough: false,
        message: '金丹需要修炼法门！你尚未修炼法门，无法凝结金丹。'
      };
    }

    // 检查是否有玄级以上功法
    const hasHighGradeArt = player.cultivationArts.some(artId => {
      const art = CULTIVATION_ARTS.find(a => a.id === artId);
      return art && (art.grade === '天' || art.grade === '地' || art.grade === '玄');
    });

    if (!hasHighGradeArt) {
      return {
        canBreakthrough: false,
        message: '金丹需要玄级以上功法！你当前修炼的功法等级不足，无法凝结金丹。'
      };
    }
  }

  // 元婴期检查
  if (targetRealm === '元婴期' && !player.heavenEarthEssence) {
    return {
      canBreakthrough: false,
      message: '元婴需要天地精华！你尚未获得天地精华，无法凝聚元婴。'
    };
  }

  // 化神期检查
  if (targetRealm === '化神期' && !player.heavenEarthMarrow) {
    return {
      canBreakthrough: false,
      message: '化神需要天地之髓！你尚未获得天地之髓，无法炼神化虚。'
    };
  }

  // 化神期检查炼化进度
  if (targetRealm === '化神期' && player.heavenEarthMarrow && player.marrowRefiningProgress !== 100) {
    return {
      canBreakthrough: false,
      message: `天地之髓炼化尚未完成！当前进度：${player.marrowRefiningProgress || 0}%`
    };
  }

  // 合道期检查
  if (targetRealm === '合道期' && !player.daoCombiningChallenged) {
    return {
      canBreakthrough: false,
      message: '合道需要挑战天地之魄！你尚未挑战天地之魄，无法以身合道。'
    };
  }

  // 长生境检查
  if (targetRealm === '长生境' && (!player.longevityRules || player.longevityRules.length === 0)) {
    return {
      canBreakthrough: false,
      message: '长生需要规则之力！你尚未获得任何规则之力，无法证道长生。'
    };
  }

  return { canBreakthrough: true, message: '' };
}

/**
 * 生成金丹天劫解密游戏（数字序列找规律）
 */
export function generateGoldenCorePuzzle(methodCount: number): {
  puzzleType: '数字序列';
  difficulty: number;
  description: string;
  sequence: number[]; // 显示的序列（最后一个用?表示）
  solution: number; // 正确答案
  pattern: string; // 规律描述
  maxAttempts: number;
} {
  const difficulty = getGoldenCoreTribulationDifficulty(methodCount);

  // 根据难度生成不同复杂度的序列
  let sequence: number[] = [];
  let solution: number;
  let pattern: string;

  // 难度分级调整：1简单，2-3中等，4+困难（略微提升难度）
  const difficultyLevel = Math.min(Math.floor(difficulty), 6);

  if (difficultyLevel <= 1) {
    // 简单：等差数列（增加序列长度到5个，让规律更明显但需要更多观察）
    const start = Math.floor(Math.random() * 15) + 1;
    const step = Math.floor(Math.random() * 6) + 2; // 步长2-7（略微增加范围）
    sequence = [start, start + step, start + step * 2, start + step * 3, start + step * 4];
    solution = start + step * 5;
    pattern = `等差数列，每次增加 ${step}`;
  } else if (difficultyLevel <= 3) {
    // 中等：等比数列、递增步长或混合规律
    const type = Math.floor(Math.random() * 3);
    if (type === 0) {
      // 等比数列（增加序列长度）
      const start = Math.floor(Math.random() * 5) + 2;
      const ratio = Math.floor(Math.random() * 3) + 2; // 倍数2-4
      sequence = [start, start * ratio, start * ratio * ratio, start * ratio * ratio * ratio, start * ratio * ratio * ratio * ratio];
      solution = start * ratio * ratio * ratio * ratio * ratio;
      pattern = `等比数列，每次乘以 ${ratio}`;
    } else if (type === 1) {
      // 递增步长（增加序列长度）
      const start = Math.floor(Math.random() * 10) + 1;
      sequence = [start, start + 2, start + 5, start + 9, start + 14]; // +2, +3, +4, +5
      solution = start + 20; // +6
      pattern = `递增步长：+2, +3, +4, +5, +6...`;
    } else {
      // 递减步长（新类型）
      const start = Math.floor(Math.random() * 30) + 20;
      sequence = [start, start - 3, start - 5, start - 6, start - 6]; // -3, -2, -1, 0
      solution = start - 5; // +1（开始递增）
      pattern = `先递减后递增的规律`;
    }
  } else {
    // 困难：复杂规律（增加更多类型）
    const type = Math.floor(Math.random() * 5);
    if (type === 0) {
      // 平方序列
      const base = Math.floor(Math.random() * 5) + 2;
      sequence = [base * base, (base + 1) * (base + 1), (base + 2) * (base + 2), (base + 3) * (base + 3), (base + 4) * (base + 4)];
      solution = (base + 5) * (base + 5);
      pattern = `平方序列：${base}², ${base + 1}², ${base + 2}²...`;
    } else if (type === 1) {
      // 斐波那契变种（改进）
      const a = Math.floor(Math.random() * 5) + 1;
      const b = Math.floor(Math.random() * 5) + 1;
      sequence = [a, b, a + b, a + b * 2, a * 2 + b * 3];
      solution = a * 3 + b * 5;
      pattern = `斐波那契变种：每个数是前两个数的组合`;
    } else if (type === 2) {
      // 交替规律（改进）
      const start = Math.floor(Math.random() * 10) + 1;
      sequence = [start, start * 2, start * 2 + 3, (start * 2 + 3) * 2, (start * 2 + 3) * 2 + 3];
      solution = ((start * 2 + 3) * 2 + 3) * 2;
      pattern = `交替规律：×2 和 +3 交替`;
    } else if (type === 3) {
      // 质数序列（新类型）
      const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23];
      const startIdx = Math.floor(Math.random() * 4);
      sequence = primes.slice(startIdx, startIdx + 5);
      solution = primes[startIdx + 5];
      pattern = `质数序列`;
    } else {
      // 立方序列（新类型）
      const base = Math.floor(Math.random() * 4) + 2;
      sequence = [base * base * base, (base + 1) ** 3, (base + 2) ** 3, (base + 3) ** 3, (base + 4) ** 3];
      solution = (base + 5) ** 3;
      pattern = `立方序列：${base}³, ${base + 1}³, ${base + 2}³...`;
    }
  }

  return {
    puzzleType: '数字序列',
    difficulty,
    description: `请仔细观察数字序列的规律，找出下一个数字。`,
    sequence,
    solution,
    pattern,
    maxAttempts: Math.max(3, 9 - Math.floor(difficulty)) // 略微减少尝试次数
  };
}

/**
 * 生成元婴天劫解密游戏（2048）
 */
export function generateNascentSoulPuzzle(essenceQuality: number): {
  puzzleType: '天地棋局';
  difficulty: number;
  description: string;
  targetScore: number;
} {
  const difficulty = essenceQuality / 100;

  // 固定目标分数为1000（元婴天劫）
  const targetScore = 1000;

  return {
    puzzleType: '天地棋局',
    difficulty,
    description: `通过移动方块合成更大的数字，达到目标分数 ${targetScore} 即可通过天劫。使用方向键或点击按钮移动。`,
    targetScore
  };
}

/**
 * 生成化神天劫解密游戏（符文序列）
 */
export function generateSpiritSeveringPuzzle(marrowQuality: number): {
  puzzleType: '符文序列';
  difficulty: number;
  description: string;
  sequence: string[];
  targetSequence: string[];
  maxSteps: number;
} {
  const difficulty = marrowQuality / 100;
  const sequenceLength = Math.min(4 + Math.floor(difficulty * 2), 8);

  // 生成符文序列
  const symbols = ['天', '地', '玄', '黄', '宇', '宙', '洪', '荒'];
  const targetSequence = Array.from({length: sequenceLength}, () =>
    symbols[Math.floor(Math.random() * symbols.length)]
  );

  // 生成初始序列（与目标序列稍有不同）
  const initialSequence = [...targetSequence];
  // 随机打乱几个位置
  for (let i = 0; i < Math.floor(difficulty); i++) {
    const pos1 = Math.floor(Math.random() * sequenceLength);
    const pos2 = Math.floor(Math.random() * sequenceLength);
    [initialSequence[pos1], initialSequence[pos2]] = [initialSequence[pos2], initialSequence[pos1]];
  }

  return {
    puzzleType: '符文序列',
    difficulty,
    description: '请将符文按照正确的顺序排列。每个操作可以交换相邻的两个符文。',
    sequence: initialSequence,
    targetSequence,
    maxSteps: Math.max(5, 15 - Math.floor(difficulty * 3))
  };
}

/**
 * 生成长生天劫解密游戏（五重考验）
 */
export function generateLongevityPuzzle(ruleCount: number): {
  puzzleType: '五重考验';
  description: string;
  challenges: Array<{
    type: '八卦阵' | '天地棋局' | '符文序列' | '心魔考验' | '天道问答';
    difficulty: number;
    data: any;
  }>;
} {
  const challenges: Array<{
    type: '八卦阵' | '天地棋局' | '符文序列' | '心魔考验' | '天道问答';
    difficulty: number;
    data: any;
  }> = [
    {
      type: '八卦阵' as const,
      difficulty: 0.8 + ruleCount * 0.1,
      data: generateGoldenCorePuzzle(Math.min(ruleCount + 3, 9))
    },
    {
      type: '天地棋局' as const,
      difficulty: 0.9 + ruleCount * 0.1,
      data: {
        ...generateNascentSoulPuzzle(80 + ruleCount * 10),
        targetScore: 2000  // 长生天劫2048游戏目标分数为2000
      }
    },
    {
      type: '符文序列' as const,
      difficulty: 1.0 + ruleCount * 0.1,
      data: generateSpiritSeveringPuzzle(90 + ruleCount * 10)
    },
    {
      type: '心魔考验' as const,
      difficulty: 1.2 + ruleCount * 0.1,
      data: {
        description: '面对内心最深处的恐惧和欲望，保持道心坚定。',
        questions: [
          '长生之道，何为真？',
          '若得永生，愿付出何代价？',
          '天道无情，人道何存？'
        ]
      }
    },
    {
      type: '天道问答' as const,
      difficulty: 1.5 + ruleCount * 0.1,
      data: {
        description: '回答天道提出的终极问题，证明你有资格逆天而行。',
        questions: [
          '天地为何而生？',
          '长生为何而求？',
          '规则为何而逆？'
        ]
      }
    }
  ];

  return {
    puzzleType: '五重考验',
    description: '长生天劫共有五重考验，需全部通过方可证道长生。',
    challenges
  };
}