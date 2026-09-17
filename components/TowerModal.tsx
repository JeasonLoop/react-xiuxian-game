import React, { useState, useMemo } from 'react';
import { PlayerStats } from '../types';
import { Modal } from './common';
import {
  Shield,
  Swords,
  Award,
  Sparkles,
  Zap,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Flame,
  Scroll,
} from 'lucide-react';
import { getTowerFloorConfig } from '../constants/tower';
import { challengeTowerFloor, sweepTower } from '../services/towerService';
import { useGameStore } from '../store/gameStore';
import dayjs from 'dayjs';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerStats;
  setPlayer: (player: PlayerStats | ((prev: PlayerStats) => PlayerStats)) => void;
  addLog: (text: string, type?: string) => void;
}

export const TowerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  player,
  setPlayer,
  addLog,
}) => {
  const highestFloor = player.tower?.highestFloor || 0;
  const nextTargetFloor = Math.min(100, highestFloor + 1);
  const [selectedFloor, setSelectedFloor] = useState<number>(nextTargetFloor);
  const [combatLogs, setCombatLogs] = useState<string[]>([]);
  const [isChallenging, setIsChallenging] = useState(false);

  // 今日是否已扫荡
  const today = dayjs().format('YYYY-MM-DD');
  const isSweptToday = player.tower?.lastSweepDate === today && player.tower?.dailySwept;

  // 当前选中关卡数据
  const floorConfig = useMemo(() => {
    return getTowerFloorConfig(selectedFloor);
  }, [selectedFloor]);

  if (!isOpen) return null;

  // 处理挑战
  const handleChallenge = () => {
    if (isChallenging) return;
    if (player.hp <= 50) {
      addLog('你气血极度亏空，强行闯关恐有性命之忧，请先疗伤或打坐！', 'danger');
      return;
    }

    setIsChallenging(true);
    setCombatLogs(['天地倒悬，雷霆贯耳，你毅然跨入通天大阵……']);

    setTimeout(() => {
      const latestPlayer = useGameStore.getState().player || player;
      const { result, updatedPlayer } = challengeTowerFloor(latestPlayer, selectedFloor);
      setPlayer((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          hp: updatedPlayer.hp,
          exp: updatedPlayer.exp,
          spiritStones: updatedPlayer.spiritStones,
          inventory: updatedPlayer.inventory,
          tower: updatedPlayer.tower,
        };
      });
      setCombatLogs(result.combatLogs);

      if (result.success) {
        addLog(`【破关大捷】你成功登上了九天通天塔第 ${selectedFloor} 层！`, 'special');
        if (selectedFloor < 100) {
          setSelectedFloor(selectedFloor + 1);
        }
      } else {
        addLog(`【挑战惜败】第 ${selectedFloor} 层守塔灵阵威能磅礴，你不得不退回休整。`, 'danger');
      }
      setIsChallenging(false);
    }, 600);
  };

  // 处理每日扫荡
  const handleSweep = () => {
    if (highestFloor <= 0) {
      addLog('你尚未通关任何一层，无法进行扫荡！', 'normal');
      return;
    }
    if (isSweptToday) {
      addLog('今日扫荡机缘已享，请明日再行登塔扫荡！', 'normal');
      return;
    }

    const latestPlayer = useGameStore.getState().player || player;
    const { success, message, updatedPlayer, rewards } = sweepTower(latestPlayer);
    if (success && rewards) {
      setPlayer((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          exp: updatedPlayer.exp,
          spiritStones: updatedPlayer.spiritStones,
          inventory: updatedPlayer.inventory,
          tower: updatedPlayer.tower,
        };
      });
      addLog(message, 'special');
      addLog(
        `【扫荡收获】获得修为 +${rewards.exp.toLocaleString()}，灵石 +${rewards.spiritStones.toLocaleString()}，珍稀物品 x${rewards.items.length}`,
        'gain'
      );
    } else {
      addLog(message, 'normal');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="九天通天塔"
      titleIcon={<Flame size={20} className="text-amber-400" />}
      size="4xl"
    >
      <div className="space-y-4 text-stone-200">
        {/* 顶部通天塔信息横幅 */}
        <div className="bg-linear-to-r from-amber-950/60 via-stone-900/90 to-purple-950/60 border border-amber-600/40 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-amber-300">九天通天塔</span>
              <span className="text-xs px-2 py-0.5 bg-amber-900/60 text-amber-200 border border-amber-700/50 rounded">
                共 100 重天
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-1">
              远古诸仙所留的淬道绝境。每破一重天即可获得大道赐福、太虚洗炼石与神通道藏！
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-stone-400">历史最高破关</div>
              <div className="text-xl font-bold text-amber-400 font-mono">
                第 {highestFloor} 层
              </div>
            </div>

            <button
              onClick={handleSweep}
              disabled={highestFloor <= 0 || Boolean(isSweptToday)}
              className={`px-3.5 py-2 rounded border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                highestFloor > 0 && !isSweptToday
                  ? 'bg-purple-900/70 hover:bg-purple-800 border-purple-600 text-purple-200 shadow-md shadow-purple-950/50 cursor-pointer'
                  : 'bg-stone-800/60 border-stone-700 text-stone-500 cursor-not-allowed'
              }`}
              title={isSweptToday ? '今日已扫荡' : '一键扫荡已通关层数'}
            >
              <RotateCcw size={14} />
              {isSweptToday ? '今日已扫荡' : '每日一键扫荡'}
            </button>
          </div>
        </div>

        {/* 楼层浏览与定位控制器 */}
        <div className="flex items-center justify-between bg-stone-900/70 border border-stone-800 rounded p-2.5">
          <button
            onClick={() => setSelectedFloor((prev) => Math.max(1, prev - 1))}
            disabled={selectedFloor <= 1}
            className="p-1.5 text-stone-400 hover:text-amber-300 disabled:opacity-30 disabled:hover:text-stone-400 rounded transition-colors"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="flex items-center gap-3">
            <span className="font-bold text-base text-amber-200">
              第 {selectedFloor} 重天
            </span>
            {selectedFloor <= highestFloor ? (
              <span className="text-xs px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded">
                已通关
              </span>
            ) : selectedFloor === nextTargetFloor ? (
              <span className="text-xs px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-700 rounded animate-pulse">
                挑战目标
              </span>
            ) : (
              <span className="text-xs px-2 py-0.5 bg-stone-800 text-stone-400 border border-stone-700 rounded">
                未解锁
              </span>
            )}
            <button
              onClick={() => setSelectedFloor(nextTargetFloor)}
              className="text-xs text-amber-400 hover:underline ml-2"
            >
              [回到待挑战层]
            </button>
          </div>

          <button
            onClick={() => setSelectedFloor((prev) => Math.min(100, prev + 1))}
            disabled={selectedFloor >= 100}
            className="p-1.5 text-stone-400 hover:text-amber-300 disabled:opacity-30 disabled:hover:text-stone-400 rounded transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* 守关者与首通战利网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 左侧：守关者详情 */}
          <div className="bg-stone-900/80 border border-stone-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2">
              <div className="flex items-center gap-2">
                <Shield size={18} className="text-red-400" />
                <span className="font-bold text-stone-100">{floorConfig.guardianName}</span>
              </div>
              <span className="text-xs px-2 py-0.5 bg-red-950/70 border border-red-800 text-red-300 rounded font-medium">
                {floorConfig.realm}
              </span>
            </div>

            <p className="text-xs text-stone-400 italic">
              {floorConfig.description}
            </p>

            {/* 守关者属性数据 */}
            <div className="grid grid-cols-2 gap-2 text-xs bg-stone-950/60 p-2.5 rounded border border-stone-800/80">
              <div className="flex justify-between">
                <span className="text-stone-400">气血值:</span>
                <span className="text-emerald-400 font-mono">{floorConfig.baseHp.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">攻击力:</span>
                <span className="text-red-400 font-mono">{floorConfig.baseAttack.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">防御力:</span>
                <span className="text-blue-400 font-mono">{floorConfig.baseDefense.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">速度值:</span>
                <span className="text-yellow-400 font-mono">{floorConfig.baseSpeed}</span>
              </div>
            </div>
          </div>

          {/* 右侧：破关大礼预览 */}
          <div className="bg-stone-900/80 border border-stone-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 border-b border-stone-800 pb-2">
              <Award size={18} className="text-amber-400" />
              <span className="font-bold text-stone-100">首通破关奖励</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between bg-stone-950/60 p-2 rounded border border-stone-800/80">
                <span className="text-stone-400 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-400" />
                  灵石资粮
                </span>
                <span className="text-amber-300 font-mono font-medium">
                  +{floorConfig.firstClearRewards.spiritStones.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between bg-stone-950/60 p-2 rounded border border-stone-800/80">
                <span className="text-stone-400 flex items-center gap-1.5">
                  <Zap size={14} className="text-purple-400" />
                  浩瀚修为
                </span>
                <span className="text-purple-300 font-mono font-medium">
                  +{floorConfig.firstClearRewards.exp.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between bg-stone-950/60 p-2 rounded border border-stone-800/80">
                <span className="text-stone-400 flex items-center gap-1.5">
                  <Flame size={14} className="text-orange-400" />
                  太虚洗炼石
                </span>
                <span className="text-orange-300 font-mono font-medium">
                  x{floorConfig.firstClearRewards.reforgeStones}
                </span>
              </div>

              {floorConfig.firstClearRewards.comprehensionScrolls && (
                <div className="flex items-center justify-between bg-purple-950/40 p-2 rounded border border-purple-800/60">
                  <span className="text-purple-300 flex items-center gap-1.5 font-medium">
                    <Scroll size={14} className="text-purple-400" />
                    太虚悟道卷 (稀有秘藏)
                  </span>
                  <span className="text-purple-200 font-mono font-bold">
                    x{floorConfig.firstClearRewards.comprehensionScrolls}
                  </span>
                </div>
              )}

              {floorConfig.firstClearRewards.items?.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between bg-amber-950/40 p-2 rounded border border-amber-800/60"
                >
                  <span className="text-amber-300 font-medium flex items-center gap-1">
                    <Sparkles size={14} className="text-amber-400" />
                    特殊秘宝：{item.name}
                  </span>
                  <span className="text-amber-200 font-mono">x{item.quantity || 1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 战斗演武战报输出框 */}
        {combatLogs.length > 0 && (
          <div className="bg-black/60 border border-stone-800 rounded-lg p-3 max-h-36 overflow-y-auto font-mono text-xs space-y-1">
            {combatLogs.map((log, index) => (
              <div
                key={index}
                className={
                  log.includes('破关大捷')
                    ? 'text-amber-400 font-bold'
                    : log.includes('落败')
                    ? 'text-red-400'
                    : 'text-stone-300'
                }
              >
                {log}
              </div>
            ))}
          </div>
        )}

        {/* 底部行动操作栏 */}
        <div className="flex justify-end gap-3 pt-2 border-t border-stone-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded text-sm transition-colors cursor-pointer"
          >
            离开天塔
          </button>

          <button
            onClick={handleChallenge}
            disabled={selectedFloor > nextTargetFloor || isChallenging}
            className={`px-6 py-2 rounded text-sm font-bold flex items-center gap-2 transition-all ${
              selectedFloor === nextTargetFloor && !isChallenging
                ? 'bg-amber-600 hover:bg-amber-500 text-stone-950 shadow-lg shadow-amber-900/50 cursor-pointer'
                : selectedFloor < nextTargetFloor
                ? 'bg-stone-700 hover:bg-stone-600 text-stone-200 cursor-pointer'
                : 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed'
            }`}
          >
            <Swords size={16} />
            {isChallenging
              ? '激战演算中...'
              : selectedFloor < nextTargetFloor
              ? `复战 第 ${selectedFloor} 重天`
              : `挑战 第 ${selectedFloor} 重天`}
          </button>
        </div>
      </div>
    </Modal>
  );
};
export default TowerModal;
