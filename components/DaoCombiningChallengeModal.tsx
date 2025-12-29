import React, { useState,} from 'react';
import { X, Sword, Shield, Zap, Heart,} from 'lucide-react';
import { PlayerStats, DaoCombiningChallengeState } from '../types';
import { HEAVEN_EARTH_SOUL_BOSSES, DAO_COMBINING_CHALLENGE_CONFIG } from '../constants/index';
import { executePlayerAction, executeEnemyTurn, checkBattleEnd, calculateBattleRewards } from '../services/battleService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerStats;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerStats>>;
  addLog: (message: string, type?: string) => void;
  challengeState: DaoCombiningChallengeState;
  setChallengeState: React.Dispatch<React.SetStateAction<DaoCombiningChallengeState>>;
}

const DaoCombiningChallengeModal: React.FC<Props> = ({
  isOpen,
  onClose,
  player,
  setPlayer,
  addLog,
  challengeState,
  setChallengeState
}) => {
  const [selectedBossId, setSelectedBossId] = useState<string | null>(null);
  const [bossAttempts, setBossAttempts] = useState<Record<string, number>>({});
  // 处理战斗的函数
  const handleBattle = async (battleState: any) => {
    // 使用回合制战斗系统处理战斗
    let currentState = battleState;

    // 战斗循环
    while (!checkBattleEnd(currentState)) {
      if (currentState.isPlayerTurn) {
        // 玩家回合 - 这里需要处理玩家行动
        // 简化处理：玩家自动普通攻击
        const playerAction = { type: 'attack' as const };
        currentState = executePlayerAction(currentState, playerAction);
      } else {
        // 敌人回合
        currentState = executeEnemyTurn(currentState);
      }
    }

    // 计算战斗结果
    const victory = currentState.enemy.hp <= 0;
    const hpLoss = Math.max(0, battleState.player.hp - currentState.player.hp);

    // 计算奖励
    const rewards = calculateBattleRewards(currentState, player);

    return {
      victory,
      hpLoss,
      expChange: rewards.expChange,
      spiritChange: rewards.spiritChange,
      summary: victory ?
        `恭喜！你成功击败了【${currentState.enemy.name}】！获得${rewards.expChange}修为和${rewards.spiritChange}灵石！` :
        `挑战【${currentState.enemy.name}】失败！损失了${hpLoss}点气血。`
    };
  };

  // 检查解锁条件
  const canChallengeDaoCombining = () => {
    if (player.realm !== DAO_COMBINING_CHALLENGE_CONFIG.requiredRealm || player.realmLevel < DAO_COMBINING_CHALLENGE_CONFIG.requiredRealmLevel) {
      return false;
    }

    if (!player.heavenEarthMarrow) {
      return false;
    }

    // 检查属性是否足够
    const totalStats = player.attack + player.defense + player.spirit + player.physique + player.speed;
    return totalStats > 100000;
  };

  // 选择BOSS
  const handleSelectBoss = (bossId: string) => {
    const boss = HEAVEN_EARTH_SOUL_BOSSES[bossId];
    const attempts = bossAttempts[bossId] || 0;

    if (attempts >= DAO_COMBINING_CHALLENGE_CONFIG.maxBossAttempts) {
      addLog(`该BOSS的挑战次数已达上限（${DAO_COMBINING_CHALLENGE_CONFIG.maxBossAttempts}次）！`, 'danger');
      return;
    }

    setSelectedBossId(bossId);
    addLog(`你选择了挑战【${boss.name}】！准备迎接强大的天地之魄吧！`, 'special');
  };

  // 开始挑战
  const handleStartChallenge = async () => {
    if (!selectedBossId) return;

    const boss = HEAVEN_EARTH_SOUL_BOSSES[selectedBossId];

    // 生成随机强度倍数
    const [min, max] = DAO_COMBINING_CHALLENGE_CONFIG.bossStrengthMultiplierRange;
    const strengthMultiplier = Math.random() * (max - min) + min;

    setChallengeState({
      isOpen: true,
      bossId: selectedBossId,
      bossStrengthMultiplier: strengthMultiplier,
      battleResult: null
    });

    // 创建战斗状态
    const battleState = {
      id: `dao_combining_${Date.now()}`,
      round: 0,
      turn: 'player' as const,
      player: {
        id: 'player',
        name: player.name,
        realm: player.realm,
        hp: player.hp,
        maxHp: player.maxHp,
        attack: player.attack,
        defense: player.defense,
        speed: player.speed,
        spirit: player.spirit,
        buffs: [],
        debuffs: [],
        skills: [],
        cooldowns: {},
        mana: 1000,
        maxMana: 1000,
        isDefending: false
      },
      enemy: {
        id: boss.id,
        name: boss.name,
        realm: boss.realm,
        hp: boss.baseStats.hp * strengthMultiplier,
        maxHp: boss.baseStats.hp * strengthMultiplier,
        attack: boss.baseStats.attack * strengthMultiplier,
        defense: boss.baseStats.defense * strengthMultiplier,
        speed: boss.baseStats.speed,
        spirit: boss.baseStats.spirit * strengthMultiplier,
        buffs: [],
        debuffs: [],
        skills: boss.specialSkills,
        cooldowns: {},
        mana: 2000,
        maxMana: 2000,
        isDefending: false
      },
      history: [],
      isPlayerTurn: true,
      waitingForPlayerAction: true,
      playerInventory: player.inventory,
      playerActionsRemaining: 1,
      enemyActionsRemaining: 1,
      playerMaxActions: 1,
      enemyMaxActions: 1,
      enemyStrengthMultiplier: strengthMultiplier,
      adventureType: 'normal' as const,
      riskLevel: '极度危险' as const
    };

    // 进行战斗
    const result = await handleBattle(battleState);

    setChallengeState(prev => ({
      ...prev,
      battleResult: result
    }));

    // 更新挑战次数
    setBossAttempts(prev => ({
      ...prev,
      [selectedBossId]: (prev[selectedBossId] || 0) + 1
    }));

    if (result.victory) {
      // 胜利奖励
      setPlayer(prev => ({
        ...prev,
        exp: prev.exp + boss.rewards.exp,
        spiritStones: prev.spiritStones + boss.rewards.spiritStones,
        daoCombiningChallenged: true
      }));

      addLog(`恭喜！你成功击败了【${boss.name}】！获得${boss.rewards.exp.toLocaleString()}修为和${boss.rewards.spiritStones.toLocaleString()}灵石！`, 'gain');
      addLog('你已获得合道期的挑战资格！现在可以尝试突破至合道期了！', 'special');
    } else {
      addLog(`挑战【${boss.name}】失败！继续努力提升实力吧！`, 'danger');
    }
  };

  // 获取BOSS难度颜色
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-500';
      case 'normal': return 'text-blue-500';
      case 'hard': return 'text-orange-500';
      case 'extreme': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            合道期挑战 - 天地之魄
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* 挑战说明 */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
              挑战说明
            </h3>
            <p className="text-blue-800 dark:text-blue-200">
              要突破至合道期，必须击败一位天地之魄，证明自己拥有与天地抗衡的实力。
              每个BOSS都有不同的难度和挑战次数限制，请谨慎选择！
            </p>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
              <p>• 需要达到化神期九层</p>
              <p>• 需要炼化天地之髓</p>
              <p>• 需要强大的属性基础</p>
              <p>• 每个BOSS最多挑战{DAO_COMBINING_CHALLENGE_CONFIG.maxBossAttempts}次</p>
            </div>
          </div>

          {/* 挑战条件检查 */}
          {!canChallengeDaoCombining() && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900 rounded-lg">
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
                挑战条件未满足
              </h3>
              <ul className="text-red-800 dark:text-red-200 space-y-1">
                {player.realm !== DAO_COMBINING_CHALLENGE_CONFIG.requiredRealm && (
                  <li>• 需要达到{DAO_COMBINING_CHALLENGE_CONFIG.requiredRealm}</li>
                )}
                {player.realmLevel < DAO_COMBINING_CHALLENGE_CONFIG.requiredRealmLevel && (
                  <li>• 需要达到{DAO_COMBINING_CHALLENGE_CONFIG.requiredRealmLevel}层</li>
                )}
                {!player.heavenEarthMarrow && (
                  <li>• 需要炼化天地之髓</li>
                )}
              </ul>
            </div>
          )}

          {/* BOSS选择 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {Object.entries(HEAVEN_EARTH_SOUL_BOSSES).map(([bossId, boss]) => {
              const attempts = bossAttempts[bossId] || 0;
              const remainingAttempts = DAO_COMBINING_CHALLENGE_CONFIG.maxBossAttempts - attempts;
              const isSelected = selectedBossId === bossId;
              const isMaxAttempts = attempts >= DAO_COMBINING_CHALLENGE_CONFIG.maxBossAttempts;

              return (
                <div
                  key={bossId}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                      : isMaxAttempts
                      ? 'border-red-300 bg-red-50 dark:bg-red-900 opacity-60'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                  }`}
                  onClick={() => !isMaxAttempts && handleSelectBoss(bossId)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">{boss.name}</h3>
                    <span className={`text-sm font-medium ${getDifficultyColor(boss.difficulty)}`}>
                      {boss.difficulty === 'easy' ? '简单' :
                       boss.difficulty === 'normal' ? '普通' :
                       boss.difficulty === 'hard' ? '困难' : '极难'}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    {boss.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center">
                      <Sword size={12} className="mr-1" />
                      <span>攻击: {boss.baseStats.attack.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center">
                      <Shield size={12} className="mr-1" />
                      <span>防御: {boss.baseStats.defense.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center">
                      <Heart size={12} className="mr-1" />
                      <span>生命: {boss.baseStats.hp.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center">
                      <Zap size={12} className="mr-1" />
                      <span>灵力: {boss.baseStats.spirit.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      挑战次数: {attempts}/{DAO_COMBINING_CHALLENGE_CONFIG.maxBossAttempts}
                    </span>
                    {isMaxAttempts && (
                      <span className="text-xs text-red-500">已达上限</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 战斗结果 */}
          {challengeState.battleResult && (
            <div className={`mb-6 p-4 rounded-lg ${
              challengeState.battleResult.victory
                ? 'bg-green-50 dark:bg-green-900'
                : 'bg-red-50 dark:bg-red-900'
            }`}>
              <h3 className="text-lg font-semibold mb-2">
                {challengeState.battleResult.victory ? '挑战成功！' : '挑战失败'}
              </h3>
              <p className={challengeState.battleResult.victory ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}>
                {challengeState.battleResult.summary}
              </p>
            </div>
          )}

          {/* 行动按钮 */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              取消
            </button>

            {canChallengeDaoCombining() && selectedBossId && (
              <button
                onClick={handleStartChallenge}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={!selectedBossId}
              >
                开始挑战
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DaoCombiningChallengeModal;