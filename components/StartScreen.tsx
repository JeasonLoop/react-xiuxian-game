import React, { useState } from 'react';
import { Talent } from '../types';
import { TALENTS } from '../constants';
import { Sparkles, Sword, Shield, Heart, Zap, User } from 'lucide-react';

interface Props {
  onStart: (playerName: string, talentId: string) => void;
}

const StartScreen: React.FC<Props> = ({ onStart }) => {
  const [playerName, setPlayerName] = useState('');
  const [selectedTalentId, setSelectedTalentId] = useState<string | null>(null);

  // 随机生成一个天赋
  const availableTalents = TALENTS;
  const randomTalent = availableTalents[Math.floor(Math.random() * availableTalents.length)];

  // 如果没有选择天赋，使用随机天赋
  const finalTalentId = selectedTalentId || randomTalent.id;
  const selectedTalent = TALENTS.find(t => t.id === finalTalentId);

  const handleStart = () => {
    if (!playerName.trim()) {
      alert('请输入修仙者名称！');
      return;
    }
    onStart(playerName.trim(), finalTalentId);
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case '稀有': return 'text-blue-400 border-blue-500';
      case '传说': return 'text-purple-400 border-purple-500';
      case '仙品': return 'text-yellow-400 border-yellow-500';
      default: return 'text-stone-300 border-stone-500';
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 flex items-center justify-center z-50">
      <div className="bg-paper-800 border-2 border-mystic-gold rounded-lg p-8 max-w-2xl w-full mx-4 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif font-bold text-mystic-gold tracking-widest mb-2">
            云灵修仙
          </h1>
          <p className="text-stone-400 text-lg">踏上你的长生之路</p>
        </div>

        <div className="space-y-6">
          {/* 输入名称 */}
          <div>
            <label className="block text-stone-300 mb-2 font-semibold flex items-center gap-2">
              <User size={20} />
              修仙者名称
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="请输入你的道号..."
              className="w-full px-4 py-3 bg-stone-700 border border-stone-600 rounded text-stone-200 placeholder-stone-500 focus:outline-none focus:border-mystic-jade focus:ring-2 focus:ring-mystic-jade/50"
              maxLength={20}
            />
          </div>

          {/* 天赋选择（只显示，不可修改） */}
          <div>
            <label className="block text-stone-300 mb-2 font-semibold flex items-center gap-2">
              <Sparkles size={20} />
              天生天赋（随机生成，不可修改）
            </label>
            <div className={`p-4 rounded border-2 ${getRarityColor(selectedTalent?.rarity || '普通')} bg-stone-800/50`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold">{selectedTalent?.name}</h3>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${getRarityColor(selectedTalent?.rarity || '普通')}`}>
                  {selectedTalent?.rarity}
                </span>
              </div>
              <p className="text-stone-300 mb-3">{selectedTalent?.description}</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {selectedTalent?.effects.attack && (
                  <div className="flex items-center gap-1 text-stone-300">
                    <Sword size={16} className="text-red-400" />
                    <span>攻击 +{selectedTalent.effects.attack}</span>
                  </div>
                )}
                {selectedTalent?.effects.defense && (
                  <div className="flex items-center gap-1 text-stone-300">
                    <Shield size={16} className="text-blue-400" />
                    <span>防御 +{selectedTalent.effects.defense}</span>
                  </div>
                )}
                {selectedTalent?.effects.hp && (
                  <div className="flex items-center gap-1 text-stone-300">
                    <Heart size={16} className="text-pink-400" />
                    <span>气血 +{selectedTalent.effects.hp}</span>
                  </div>
                )}
                {selectedTalent?.effects.spirit && (
                  <div className="flex items-center gap-1 text-stone-300">
                    <Zap size={16} className="text-yellow-400" />
                    <span>神识 +{selectedTalent.effects.spirit}</span>
                  </div>
                )}
                {selectedTalent?.effects.physique && (
                  <div className="flex items-center gap-1 text-stone-300">
                    <Shield size={16} className="text-green-400" />
                    <span>体魄 +{selectedTalent.effects.physique}</span>
                  </div>
                )}
                {selectedTalent?.effects.speed && (
                  <div className="flex items-center gap-1 text-stone-300">
                    <Zap size={16} className="text-cyan-400" />
                    <span>速度 +{selectedTalent.effects.speed}</span>
                  </div>
                )}
                {selectedTalent?.effects.expRate && (
                  <div className="flex items-center gap-1 text-stone-300">
                    <Sparkles size={16} className="text-purple-400" />
                    <span>修炼速度 +{Math.round(selectedTalent.effects.expRate * 100)}%</span>
                  </div>
                )}
                {selectedTalent?.effects.luck && (
                  <div className="flex items-center gap-1 text-stone-300">
                    <Sparkles size={16} className="text-yellow-400" />
                    <span>幸运 +{selectedTalent.effects.luck}</span>
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs text-stone-500 mt-2">
              * 天赋在游戏开始时随机生成，之后不可修改
            </p>
          </div>

          {/* 开始按钮 */}
          <button
            onClick={handleStart}
            disabled={!playerName.trim()}
            className="w-full py-4 bg-gradient-to-r from-mystic-gold to-yellow-600 hover:from-yellow-600 hover:to-mystic-gold text-stone-900 font-bold text-lg rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Sparkles size={24} />
            开始修仙之旅
          </button>
        </div>
      </div>
    </div>
  );
};

export default StartScreen;

