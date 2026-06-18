import React, { useState, useCallback, useRef, useEffect } from 'react';
import { PlayerStats, Item } from '../types';
import {
  generateDungeon,
  resolveDungeonEvent,
  DungeonState,
  DungeonEvent,
  DungeonFloor,
} from '../constants/dungeon';
import { Modal } from './common';
import { Sword, Gem, Heart, HelpCircle, Store, Skull, LogOut, ChevronRight, Map } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerStats;
  setPlayer: (player: PlayerStats | ((prev: PlayerStats) => PlayerStats)) => void;
  addLog: (text: string, type?: string) => void;
}

/**
 * 秘境 Roguelike 地宫探索 Modal
 * 多层地宫，每层3选1，奖励递增，可随时退出
 */
const DungeonModal: React.FC<Props> = ({
  isOpen,
  onClose,
  player,
  setPlayer,
  addLog,
}) => {
  const [dungeon, setDungeon] = useState<DungeonState | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<DungeonEvent | null>(null);
  const [eventResult, setEventResult] = useState<any>(null);
  const [phase, setPhase] = useState<'intro' | 'playing' | 'result' | 'exit'>('intro');
  const scrollRef = useRef<HTMLDivElement>(null);

  // 初始化/重置地宫
  const startDungeon = useCallback(() => {
    const newDungeon = generateDungeon(player);
    setDungeon(newDungeon);
    setSelectedEvent(null);
    setEventResult(null);
    setPhase('playing');
    addLog(`🏰 你进入了【${newDungeon.name}】！共 ${newDungeon.totalFloors} 层，祝你好运！`, 'special');
  }, [player, addLog]);

  // 选择事件
  const handleSelectEvent = useCallback(
    (event: DungeonEvent) => {
      if (!dungeon || phase !== 'playing') return;
      setSelectedEvent(event);

      const result = resolveDungeonEvent(event, dungeon.currentFloor + 1, player);
      setEventResult(result);
      setPhase('result');

      // 应用结果
      setPlayer((prev) => ({
        ...prev,
        exp: Math.min(prev.exp + result.expGain, prev.maxExp * 2),
        spiritStones: Math.max(0, prev.spiritStones + result.spiritStoneGain),
        hp: Math.max(1, Math.min(prev.hp + result.hpChange, prev.maxHp)),
        inventory: [...prev.inventory, ...result.items],
      }));

      addLog(result.log, result.logType);

      // 更新地宫奖励
      setDungeon((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          rewards: {
            exp: prev.rewards.exp + result.expGain,
            spiritStones: prev.rewards.spiritStones + result.spiritStoneGain,
            items: [...prev.rewards.items, ...result.items],
          },
        };
      });
    },
    [dungeon, phase, player, setPlayer, addLog]
  );

  // 进入下一层
  const nextFloor = useCallback(() => {
    if (!dungeon) return;
    const nextFloorNum = dungeon.currentFloor + 1;

    if (nextFloorNum >= dungeon.totalFloors) {
      // 通关！
      setDungeon((prev) => prev ? { ...prev, currentFloor: nextFloorNum, completed: true, isActive: false } : prev);
      setPhase('exit');
      addLog(`🏆 恭喜！你成功通关了【${dungeon.name}】！总计获得 ${dungeon.rewards.exp} 经验、${dungeon.rewards.spiritStones} 灵石！`, 'special');
      return;
    }

    setDungeon((prev) => prev ? { ...prev, currentFloor: nextFloorNum } : prev);
    setSelectedEvent(null);
    setEventResult(null);
    setPhase('playing');
  }, [dungeon, addLog]);

  // 退出地宫
  const exitDungeon = useCallback(() => {
    if (!dungeon) return;
    setDungeon((prev) => prev ? { ...prev, isActive: false } : prev);
    setPhase('exit');
    addLog(
      `🚪 你退出了【${dungeon.name}】，本次探索共获得 ${dungeon.rewards.exp} 经验、${dungeon.rewards.spiritStones} 灵石。`,
      'normal'
    );
  }, [dungeon, addLog]);

  // 打开时重置
  useEffect(() => {
    if (isOpen) {
      setDungeon(null);
      setPhase('intro');
      setSelectedEvent(null);
      setEventResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentFloorData: DungeonFloor | null =
    dungeon && dungeon.currentFloor < dungeon.totalFloors
      ? dungeon.floors[dungeon.currentFloor]
      : null;

  const eventIcons: Record<string, string> = {
    battle: '⚔️', treasure: '💎', heal: '❤️',
    mystery: '❓', merchant: '🏪', boss: '👹',
  };

  const riskColors: Record<string, string> = {
    low: 'border-green-700 bg-green-900/20',
    medium: 'border-yellow-700 bg-yellow-900/20',
    high: 'border-red-700 bg-red-900/20',
  };

  const riskLabels: Record<string, string> = {
    low: '安全', medium: '普通', high: '危险',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (phase === 'exit' || phase === 'intro') {
          onClose();
        } else {
          exitDungeon();
        }
      }}
      title={phase === 'exit' ? '探索结束' : dungeon ? `${dungeon.name}` : '秘境探索'}
      titleIcon={<Map size={18} className="md:w-5 md:h-5" />}
      size="lg"
      height="lg"
    >
      <div ref={scrollRef}>
        {/* 引入阶段 */}
        {phase === 'intro' && (
          <div className="text-center py-6 space-y-4">
            <div className="text-5xl mb-4">🏰</div>
            <h3 className="text-mystic-gold text-lg font-serif">秘境 Roguelike 探索</h3>
            <p className="text-stone-400 text-sm max-w-sm mx-auto">
              深入多层地宫，每层从3个选项中择一前行。
              奖励随层数递增，但风险也越来越大。
              <br />
              <span className="text-yellow-400">每5层有Boss守卫，击败获得巨大奖励！</span>
              <br />
              <span className="text-stone-500">可随时安全退出，保留已获得的奖励。</span>
            </p>
            <button
              onClick={startDungeon}
              className="px-6 py-3 bg-mystic-gold/80 hover:bg-mystic-gold text-stone-900 rounded font-bold font-serif text-lg transition-colors"
            >
              进入秘境
            </button>
          </div>
        )}

        {/* 游戏阶段 */}
        {phase === 'playing' && dungeon && currentFloorData && (
          <div className="space-y-4">
            {/* 进度条 */}
            <div className="bg-stone-800 rounded p-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-stone-400">
                  第 {dungeon.currentFloor + 1}/{dungeon.totalFloors} 层
                </span>
                <span className="text-stone-300">
                  已获: {dungeon.rewards.exp} 经验 · {dungeon.rewards.spiritStones} 灵石
                </span>
              </div>
              <div className="w-full bg-stone-700 rounded-full h-2">
                <div
                  className="bg-mystic-gold h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${((dungeon.currentFloor + 1) / dungeon.totalFloors) * 100}%`,
                  }}
                />
              </div>
              {currentFloorData.isBossFloor && (
                <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                  <Skull size={12} /> Boss层！选择任意事件都将面对Boss！
                </p>
              )}
            </div>

            {/* 事件选择 */}
            <h4 className="text-stone-300 font-serif text-sm">
              选择你的路径：
            </h4>
            <div className="grid grid-cols-1 gap-3">
              {currentFloorData.events.map((event, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectEvent(event)}
                  className={`text-left p-4 rounded border-2 transition-all hover:scale-[1.01] active:scale-[0.99] ${riskColors[event.risk]}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{event.icon || eventIcons[event.type]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-stone-200 font-bold text-sm">
                        {event.title}
                      </p>
                      <p className="text-stone-400 text-xs mt-1">
                        {event.description}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      event.risk === 'high' ? 'bg-red-900/50 text-red-300' :
                      event.risk === 'medium' ? 'bg-yellow-900/50 text-yellow-300' :
                      'bg-green-900/50 text-green-300'
                    }`}>
                      {riskLabels[event.risk]}
                    </span>
                    <ChevronRight size={16} className="text-stone-600 mt-1" />
                  </div>
                </button>
              ))}
            </div>

            {/* 退出按钮 */}
            <button
              onClick={exitDungeon}
              className="w-full py-2 border border-stone-700 text-stone-500 hover:text-stone-300 hover:border-stone-600 rounded text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <LogOut size={14} /> 安全退出（保留奖励）
            </button>
          </div>
        )}

        {/* 结果阶段 */}
        {phase === 'result' && eventResult && dungeon && (
          <div className="space-y-4 text-center py-4">
            <div className="text-4xl">
              {selectedEvent?.icon || '✨'}
            </div>
            <h4 className="text-stone-200 font-serif text-lg">
              {selectedEvent?.title}
            </h4>
            <p className="text-stone-400 text-sm">
              {eventResult.log}
            </p>

            <div className="bg-stone-800 rounded p-4 inline-block mx-auto">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {eventResult.expGain > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400">✨</span>
                    <span className="text-stone-300">+{eventResult.expGain} 经验</span>
                  </div>
                )}
                {eventResult.spiritStoneGain > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-400">💎</span>
                    <span className="text-stone-300">+{eventResult.spiritStoneGain} 灵石</span>
                  </div>
                )}
                {eventResult.hpChange !== 0 && (
                  <div className="flex items-center gap-2">
                    <span className={eventResult.hpChange < 0 ? 'text-red-400' : 'text-green-400'}>
                      {eventResult.hpChange < 0 ? '💔' : '❤️'}
                    </span>
                    <span className={eventResult.hpChange < 0 ? 'text-red-300' : 'text-green-300'}>
                      {eventResult.hpChange > 0 ? '+' : ''}{eventResult.hpChange} HP
                    </span>
                  </div>
                )}
                {eventResult.items?.length > 0 && (
                  <div className="flex items-center gap-2 col-span-2">
                    <span className="text-purple-400">📦</span>
                    <span className="text-stone-300">获得 {eventResult.items.length} 件物品</span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={nextFloor}
              className="px-6 py-3 bg-mystic-gold/80 hover:bg-mystic-gold text-stone-900 rounded font-bold font-serif transition-colors flex items-center gap-2 mx-auto"
            >
              继续前进 <ChevronRight size={18} />
            </button>
            <div>
              <button
                onClick={exitDungeon}
                className="text-stone-500 hover:text-stone-300 text-sm mt-2"
              >
                见好就收，退出地宫
              </button>
            </div>
          </div>
        )}

        {/* 退出阶段 */}
        {phase === 'exit' && dungeon && (
          <div className="text-center py-6 space-y-4">
            <div className="text-5xl">
              {dungeon.completed ? '🏆' : '🚪'}
            </div>
            <h3 className="text-mystic-gold text-lg font-serif">
              {dungeon.completed ? '恭喜通关！' : '探索结束'}
            </h3>
            <p className="text-stone-400 text-sm">
              {dungeon.completed
                ? `你征服了【${dungeon.name}】的所有 ${dungeon.totalFloors} 层！`
                : `你探索了 ${dungeon.currentFloor}/${dungeon.totalFloors} 层后安全退出。`}
            </p>
            <div className="bg-stone-800 rounded p-4 inline-block mx-auto">
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="text-blue-400">✨ {dungeon.rewards.exp}</span>
                  <span className="text-stone-500 ml-1">经验</span>
                </div>
                <div>
                  <span className="text-yellow-400">💎 {dungeon.rewards.spiritStones}</span>
                  <span className="text-stone-500 ml-1">灵石</span>
                </div>
                {dungeon.rewards.items.length > 0 && (
                  <div>
                    <span className="text-purple-400">📦 {dungeon.rewards.items.length}</span>
                    <span className="text-stone-500 ml-1">物品</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  startDungeon();
                }}
                className="px-4 py-2 bg-mystic-gold/80 hover:bg-mystic-gold text-stone-900 rounded font-bold transition-colors"
              >
                再次探索
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 border border-stone-600 text-stone-300 hover:bg-stone-700 rounded transition-colors"
              >
                返回
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default React.memo(DungeonModal);
