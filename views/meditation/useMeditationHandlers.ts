import { useCallback } from 'react';
import {
  ACHIEVEMENTS,
  GAME_BALANCE,
  REALM_ORDER,
} from '../../constants/index';
import { getActiveMentalArt, getPlayerTotalStats, calculateTotalExpRate } from '../../utils/statUtils';
import { getLocalDateString } from '../../utils/dateUtils';
import { useGameStore } from '../../store';
import { useUIStore } from '../../store/uiStore';

// 自动打坐汇总日志的输出间隔（每 N 次输出一条累计日志，避免挂机刷屏）
const AUTO_MEDITATE_LOG_INTERVAL = 10;
// 模块级计数器：自动打坐次数与累计修为（游戏单实例，跨渲染保持）
let autoMeditateTick = 0;
let autoMeditateAccumGain = 0;

/**
 * 打坐处理函数
 * 函数内部总是通过 useGameStore.getState() 获取最新状态（无闭包依赖），
 * 因此 useCallback 依赖为空数组、引用永久稳定。
 * 说明：升级检查由 useLevelUp 的修为圆满检测接管，此处不再重复触发。
 * @returns handleMeditate 打坐
 */
export function useMeditationHandlers() {
  const handleMeditate = useCallback(() => {
    const currentPlayer = useGameStore.getState().player;
    const currentSetPlayer = useGameStore.getState().setPlayer;
    const currentAddLog = useGameStore.getState().addLog;
    if (!currentPlayer) return;

    // 根据境界计算基础修为
    // 基础修为 = 境界基础值 * (1 + 境界层数 * 0.15)
    const realmIndex = REALM_ORDER.indexOf(currentPlayer.realm);

    // 不同境界的基础修为倍数（基于境界等级）- 降低基础倍数，减缓升级速度
    const realmBaseMultipliers = [1, 2, 4, 8, 15, 30, 60]; // 降低倍数：从[1,2,5,10,25,50,100]降低
    const realmBaseMultiplier = realmBaseMultipliers[realmIndex] || 1;

    // 基础修为 = 境界基础倍数 * 5 * (1 + currentPlayer.realmLevel * 0.1) - 降低基础值和层数加成
    let baseGain = Math.floor(
      realmBaseMultiplier * 10 * (1 + currentPlayer.realmLevel * 0.15)
    );

    // 使用统一的函数计算总修炼效率加成
    const expRateInfo = calculateTotalExpRate(currentPlayer);
    if (expRateInfo.total > 0) {
      baseGain = Math.floor(baseGain * (1 + expRateInfo.total));
    }

    const activeArt = getActiveMentalArt(currentPlayer);
    const medBalance = GAME_BALANCE.meditation;
    const isAuto = useUIStore.getState().autoMeditate;
    const today = getLocalDateString();
    const autoCountToday =
      currentPlayer.autoEnlightenmentDate === today ? (currentPlayer.autoEnlightenmentCount || 0) : 0;
    const enlightenmentChance = isAuto
      ? (autoCountToday >= medBalance.autoDailyEnlightenmentCap ? 0 : medBalance.autoEnlightenmentChance)
      : medBalance.manualEnlightenmentChance;
    const isEnlightenment = Math.random() < enlightenmentChance;
    let actualGain: number;
    let autoEnlightenmentCount = autoCountToday;

    if (isEnlightenment) {
      const span = medBalance.enlightenmentMax - medBalance.enlightenmentMin;
      const enlightenmentMultiplier = medBalance.enlightenmentMin + Math.random() * span;
      actualGain = Math.floor(baseGain * enlightenmentMultiplier);
      const artText = activeArt ? `，运转${activeArt.name}` : '';
      currentAddLog(`你突然顿悟，灵台清明，对大道有了更深的理解${artText}！(+${actualGain} 修为)`, 'special');
      if (isAuto) autoEnlightenmentCount += 1;
    } else {
      actualGain = Math.floor(baseGain * (0.85 + Math.random() * 0.3));
      if (!isAuto) {
        const artText = activeArt ? `，运转${activeArt.name}` : '';
        currentAddLog(`你潜心感悟大道${artText}。(+${actualGain} 修为)`, 'gain');
      }
    }

    // 自动打坐静默运行，每 10 次输出一条汇总日志：避免刷屏的同时让挂机进度可见
    if (isAuto) {
      autoMeditateTick += 1;
      autoMeditateAccumGain += actualGain;
      if (autoMeditateTick >= AUTO_MEDITATE_LOG_INTERVAL) {
        const artText = activeArt ? `，运转${activeArt.name}` : '';
        currentAddLog(
          `自动打坐 ×${AUTO_MEDITATE_LOG_INTERVAL}${artText}，累计修为 +${autoMeditateAccumGain}（修为满时溢出已注入修为泵）`,
          'gain'
        );
        autoMeditateTick = 0;
        autoMeditateAccumGain = 0;
      }
    }

    // 回血量、灵石收益与对应日志都在 updater 外计算/输出，保持 updater 为纯函数（避免 StrictMode 下重复记日志、随机值双取）
    // 获取实际的最大血量（包含金丹法数加成等）
    const totalStats = getPlayerTotalStats(currentPlayer);
    const actualMaxHp = totalStats.maxHp;

    // 打坐时直接加速回血：基础2倍，根据境界和层数可以增加
    // 基础倍数 = 2.0 + 境界层数 * 0.1（最高3.5倍）
    const baseMultiplier = 2.0 + Math.min(currentPlayer.realmLevel * 0.1, 1.5); // 2.0 - 3.5倍

    // 计算回血量：基础回血 * 打坐加成倍数（基于实际最大血量）
    const baseRegen = Math.max(1, Math.floor(actualMaxHp * 0.01));
    const actualRegen = Math.floor(baseRegen * baseMultiplier);

    // 直接恢复血量（使用实际最大血量作为上限）
    const newHp = Math.min(actualMaxHp, currentPlayer.hp + actualRegen);

    if (newHp > currentPlayer.hp && !isAuto) {
      currentAddLog(
        `打坐加速回血，恢复 ${actualRegen} 点气血（${baseMultiplier.toFixed(1)}倍速度）`,
        'gain'
      );
    }

    // 灵石收益（随机值在 updater 外一次取定）
    const realmIdx = REALM_ORDER.indexOf(currentPlayer.realm);
    const baseStones = Math.max(1, realmIdx * 2 + 1);
    let stoneGain = baseStones + Math.floor(Math.random() * 3) - 1;
    if (isAuto) {
      stoneGain = Math.max(0, Math.floor(stoneGain * medBalance.autoStoneMultiplier));
    }
    const newSpiritStones = currentPlayer.spiritStones + Math.max(isAuto ? 0 : 1, stoneGain);
    if (!isAuto && stoneGain > 0 && Math.random() < 0.3) {
      currentAddLog(`打坐时获得了 ${Math.max(1, stoneGain)} 灵石`, 'gain');
    }

    currentSetPlayer((prev) => {
      const stats = prev.statistics || {
        killCount: 0,
        meditateCount: 0,
        adventureCount: 0,
        equipCount: 0,
        petCount: 0,
        recipeCount: 0,
        artCount: 0,
        breakthroughCount: 0,
        secretRealmCount: 0,
      };

      return {
        ...prev,
        exp: prev.exp + actualGain,
        hp: newHp,
        spiritStones: newSpiritStones,
        autoEnlightenmentDate: isAuto ? today : prev.autoEnlightenmentDate,
        autoEnlightenmentCount: isAuto ? autoEnlightenmentCount : prev.autoEnlightenmentCount,
        statistics: {
          ...stats,
          meditateCount: stats.meditateCount + 1,
        },
      };
    });

    // 检查首次打坐成就（使用最新的 player）
    const latestPlayer = useGameStore.getState().player;
    if (latestPlayer && !latestPlayer.achievements.includes('ach-first-step')) {
      const firstMeditateAchievement = ACHIEVEMENTS.find(
        (a) => a.id === 'ach-first-step'
      );
      if (firstMeditateAchievement) {
        const latestSetPlayer = useGameStore.getState().setPlayer;
        // 成就日志在 updater 外输出，保持 updater 为纯函数（避免 StrictMode 下重复记日志）
        currentAddLog(
          `达成成就：【${firstMeditateAchievement.name}】！`,
          'special'
        );
        latestSetPlayer((prev) => {
          const newAchievements = [...prev.achievements, 'ach-first-step'];
          return {
            ...prev,
            achievements: newAchievements,
            exp: prev.exp + (firstMeditateAchievement.reward.exp || 0),
            spiritStones:
              prev.spiritStones +
              (firstMeditateAchievement.reward.spiritStones || 0),
          };
        });
      }
    }
  }, []); // 空依赖：函数内部只通过 getState 获取最新值，无任何闭包依赖

  return {
    handleMeditate,
  };
}
