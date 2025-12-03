import React, { useState, useEffect } from 'react';
import { X, Save, RotateCcw, Plus, Minus } from 'lucide-react';
import { PlayerStats, RealmType } from '../types';
import { REALM_DATA, REALM_ORDER } from '../constants';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerStats;
  onUpdatePlayer: (updates: Partial<PlayerStats>) => void;
}

const DebugModal: React.FC<Props> = ({
  isOpen,
  onClose,
  player,
  onUpdatePlayer,
}) => {
  const [localPlayer, setLocalPlayer] = useState<PlayerStats>(player);

  // 当player变化时更新本地状态
  useEffect(() => {
    setLocalPlayer(player);
  }, [player]);

  if (!isOpen) return null;

  const handleSave = () => {
    // 确保hp不超过maxHp
    const finalHp = Math.min(localPlayer.hp, localPlayer.maxHp);
    onUpdatePlayer({
      ...localPlayer,
      hp: finalHp,
    });
    onClose();
  };

  const handleReset = () => {
    setLocalPlayer(player);
  };

  const updateField = <K extends keyof PlayerStats>(
    field: K,
    value: PlayerStats[K]
  ) => {
    setLocalPlayer((prev) => ({ ...prev, [field]: value }));
  };

  const adjustNumber = (
    field: keyof PlayerStats,
    delta: number,
    min: number = 0
  ) => {
    setLocalPlayer((prev) => {
      const current = prev[field] as number;
      const newValue = Math.max(min, current + delta);
      return { ...prev, [field]: newValue };
    });
  };

  const handleRealmChange = (newRealm: RealmType) => {
    const realmData = REALM_DATA[newRealm];
    setLocalPlayer((prev) => ({
      ...prev,
      realm: newRealm,
      // 如果境界降低，调整相关属性
      maxHp: Math.max(prev.maxHp, realmData.baseMaxHp),
      hp: Math.min(prev.hp, Math.max(prev.maxHp, realmData.baseMaxHp)),
      attack: Math.max(prev.attack, realmData.baseAttack),
      defense: Math.max(prev.defense, realmData.baseDefense),
      spirit: Math.max(prev.spirit, realmData.baseSpirit),
      physique: Math.max(prev.physique, realmData.basePhysique),
      speed: Math.max(prev.speed, realmData.baseSpeed),
    }));
  };

  const handleRealmLevelChange = (newLevel: number) => {
    const clampedLevel = Math.max(1, Math.min(9, newLevel));
    setLocalPlayer((prev) => ({
      ...prev,
      realmLevel: clampedLevel,
    }));
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50 p-0 md:p-4 touch-manipulation"
      onClick={onClose}
    >
      <div
        className="bg-stone-800 md:rounded-t-2xl md:rounded-b-lg border-0 md:border border-stone-700 w-full h-[90vh] md:h-auto md:max-w-4xl md:max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-stone-800 border-b border-stone-700 p-3 md:p-4 flex justify-between items-center md:rounded-t-2xl flex-shrink-0">
          <h2 className="text-lg md:text-xl font-serif text-red-500">
            🔧 调试模式
          </h2>
          <button
            onClick={onClose}
            className="text-stone-400 active:text-white min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 space-y-6 overflow-y-auto flex-1">
          {/* 警告提示 */}
          <div className="bg-red-900/30 border border-red-700 rounded p-3 text-sm text-red-200">
            ⚠️ 调试模式：修改数据可能导致游戏异常，请谨慎操作！
          </div>

          {/* 基础信息 */}
          <div>
            <h3 className="font-bold text-stone-200 mb-3 border-b border-stone-700 pb-2">
              基础信息
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-stone-400 mb-1">
                  玩家名称
                </label>
                <input
                  type="text"
                  value={localPlayer.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200"
                />
              </div>
            </div>
          </div>

          {/* 境界和等级 */}
          <div>
            <h3 className="font-bold text-stone-200 mb-3 border-b border-stone-700 pb-2">
              境界与等级
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-stone-400 mb-1">
                  境界
                </label>
                <select
                  value={localPlayer.realm}
                  onChange={(e) =>
                    handleRealmChange(e.target.value as RealmType)
                  }
                  className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200"
                >
                  {REALM_ORDER.map((realm) => (
                    <option key={realm} value={realm}>
                      {realm}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-stone-400 mb-1">
                  境界等级 (1-9)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      handleRealmLevelChange(localPlayer.realmLevel - 1)
                    }
                    className="bg-stone-700 hover:bg-stone-600 text-stone-200 rounded px-3 py-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  >
                    <Minus size={16} />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="9"
                    value={localPlayer.realmLevel}
                    onChange={(e) =>
                      handleRealmLevelChange(parseInt(e.target.value) || 1)
                    }
                    className="flex-1 bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200 text-center"
                  />
                  <button
                    onClick={() =>
                      handleRealmLevelChange(localPlayer.realmLevel + 1)
                    }
                    className="bg-stone-700 hover:bg-stone-600 text-stone-200 rounded px-3 py-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-stone-400 mb-1">
                  经验值
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => adjustNumber('exp', -1000)}
                    className="bg-stone-700 hover:bg-stone-600 text-stone-200 rounded px-2 py-1 text-xs"
                  >
                    -1K
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={localPlayer.exp}
                    onChange={(e) =>
                      updateField(
                        'exp',
                        Math.max(0, parseInt(e.target.value) || 0)
                      )
                    }
                    className="flex-1 bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200"
                  />
                  <button
                    onClick={() => adjustNumber('exp', 1000)}
                    className="bg-stone-700 hover:bg-stone-600 text-stone-200 rounded px-2 py-1 text-xs"
                  >
                    +1K
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-stone-400 mb-1">
                  最大经验值
                </label>
                <input
                  type="number"
                  min="1"
                  value={localPlayer.maxExp}
                  onChange={(e) =>
                    updateField(
                      'maxExp',
                      Math.max(1, parseInt(e.target.value) || 1)
                    )
                  }
                  className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200"
                />
              </div>
            </div>
          </div>

          {/* 属性 */}
          <div>
            <h3 className="font-bold text-stone-200 mb-3 border-b border-stone-700 pb-2">
              属性
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { key: 'hp', label: '气血', maxKey: 'maxHp' },
                { key: 'maxHp', label: '最大气血' },
                { key: 'attack', label: '攻击力' },
                { key: 'defense', label: '防御力' },
                { key: 'spirit', label: '神识' },
                { key: 'physique', label: '体魄' },
                { key: 'speed', label: '速度' },
                { key: 'luck', label: '幸运值' },
              ].map(({ key, label, maxKey }) => {
                const value = localPlayer[key as keyof PlayerStats] as number;
                const maxValue = maxKey
                  ? (localPlayer[maxKey as keyof PlayerStats] as number)
                  : undefined;
                return (
                  <div key={key}>
                    <label className="block text-sm text-stone-400 mb-1">
                      {label}
                      {maxValue !== undefined && ` (最大: ${maxValue})`}
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          adjustNumber(key as keyof PlayerStats, -100)
                        }
                        className="bg-stone-700 hover:bg-stone-600 text-stone-200 rounded px-2 py-1 text-xs"
                      >
                        -100
                      </button>
                      <input
                        type="number"
                        min={maxValue !== undefined ? 0 : undefined}
                        max={maxValue}
                        value={value}
                        onChange={(e) => {
                          const newValue = parseInt(e.target.value) || 0;
                          const clampedValue =
                            maxValue !== undefined
                              ? Math.max(0, Math.min(maxValue, newValue))
                              : Math.max(0, newValue);
                          updateField(key as keyof PlayerStats, clampedValue);
                        }}
                        className="flex-1 bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200"
                      />
                      <button
                        onClick={() =>
                          adjustNumber(key as keyof PlayerStats, 100)
                        }
                        className="bg-stone-700 hover:bg-stone-600 text-stone-200 rounded px-2 py-1 text-xs"
                      >
                        +100
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 资源 */}
          <div>
            <h3 className="font-bold text-stone-200 mb-3 border-b border-stone-700 pb-2">
              资源
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-stone-400 mb-1">
                  灵石
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => adjustNumber('spiritStones', -1000)}
                    className="bg-stone-700 hover:bg-stone-600 text-stone-200 rounded px-2 py-1 text-xs"
                  >
                    -1K
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={localPlayer.spiritStones}
                    onChange={(e) =>
                      updateField(
                        'spiritStones',
                        Math.max(0, parseInt(e.target.value) || 0)
                      )
                    }
                    className="flex-1 bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200"
                  />
                  <button
                    onClick={() => adjustNumber('spiritStones', 1000)}
                    className="bg-stone-700 hover:bg-stone-600 text-stone-200 rounded px-2 py-1 text-xs"
                  >
                    +1K
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-stone-400 mb-1">
                  抽奖券
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => adjustNumber('lotteryTickets', -10)}
                    className="bg-stone-700 hover:bg-stone-600 text-stone-200 rounded px-2 py-1 text-xs"
                  >
                    -10
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={localPlayer.lotteryTickets}
                    onChange={(e) =>
                      updateField(
                        'lotteryTickets',
                        Math.max(0, parseInt(e.target.value) || 0)
                      )
                    }
                    className="flex-1 bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200"
                  />
                  <button
                    onClick={() => adjustNumber('lotteryTickets', 10)}
                    className="bg-stone-700 hover:bg-stone-600 text-stone-200 rounded px-2 py-1 text-xs"
                  >
                    +10
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-stone-400 mb-1">
                  属性点
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => adjustNumber('attributePoints', -10)}
                    className="bg-stone-700 hover:bg-stone-600 text-stone-200 rounded px-2 py-1 text-xs"
                  >
                    -10
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={localPlayer.attributePoints}
                    onChange={(e) =>
                      updateField(
                        'attributePoints',
                        Math.max(0, parseInt(e.target.value) || 0)
                      )
                    }
                    className="flex-1 bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200"
                  />
                  <button
                    onClick={() => adjustNumber('attributePoints', 10)}
                    className="bg-stone-700 hover:bg-stone-600 text-stone-200 rounded px-2 py-1 text-xs"
                  >
                    +10
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-stone-400 mb-1">
                  传承等级
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => adjustNumber('inheritanceLevel', -1, 0)}
                    className="bg-stone-700 hover:bg-stone-600 text-stone-200 rounded px-2 py-1 text-xs"
                  >
                    -1
                  </button>
                  <input
                    type="number"
                    min="0"
                    max="4"
                    value={localPlayer.inheritanceLevel}
                    onChange={(e) =>
                      updateField(
                        'inheritanceLevel',
                        Math.max(0, Math.min(4, parseInt(e.target.value) || 0))
                      )
                    }
                    className="flex-1 bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200"
                  />
                  <button
                    onClick={() => adjustNumber('inheritanceLevel', 1, 0)}
                    className="bg-stone-700 hover:bg-stone-600 text-stone-200 rounded px-2 py-1 text-xs"
                  >
                    +1
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 快速操作 */}
          <div>
            <h3 className="font-bold text-stone-200 mb-3 border-b border-stone-700 pb-2">
              快速操作
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <button
                onClick={() => {
                  setLocalPlayer((prev) => ({
                    ...prev,
                    hp: prev.maxHp,
                  }));
                }}
                className="bg-green-700 hover:bg-green-600 text-white rounded px-3 py-2 text-sm"
              >
                回满血
              </button>
              <button
                onClick={() => {
                  setLocalPlayer((prev) => ({
                    ...prev,
                    exp: prev.maxExp - 1,
                  }));
                }}
                className="bg-blue-700 hover:bg-blue-600 text-white rounded px-3 py-2 text-sm"
              >
                经验差1升级
              </button>
              <button
                onClick={() => {
                  setLocalPlayer((prev) => ({
                    ...prev,
                    spiritStones: 999999,
                  }));
                }}
                className="bg-yellow-700 hover:bg-yellow-600 text-white rounded px-3 py-2 text-sm"
              >
                灵石999K
              </button>
              <button
                onClick={() => {
                  setLocalPlayer((prev) => ({
                    ...prev,
                    lotteryTickets: 999,
                  }));
                }}
                className="bg-purple-700 hover:bg-purple-600 text-white rounded px-3 py-2 text-sm"
              >
                抽奖券999
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-stone-800 border-t border-stone-700 p-3 md:p-4 flex justify-end gap-2 flex-shrink-0">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-stone-700 hover:bg-stone-600 text-stone-200 rounded border border-stone-600 transition-colors"
          >
            <RotateCcw size={16} />
            重置
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded border border-red-600 transition-colors"
          >
            <Save size={16} />
            保存修改
          </button>
        </div>
      </div>
    </div>
  );
};

export default DebugModal;
