import React from 'react';
import { AdventureResult } from '../types';
import { Modal } from './common';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  event: AdventureResult['reputationEvent'];
  onChoice: (choiceIndex: number) => void;
}

const ReputationEventModal: React.FC<Props> = ({
  isOpen,
  onClose,
  event,
  onChoice,
}) => {

  if (!event) {
    return null;
  }

  // 防御性检查：确保必要字段存在
  const title = event.title || event.text || '神秘事件';
  const description = event.description || event.text || '你遇到了一个需要抉择的神秘事件。';

  if (!event.choices || !Array.isArray(event.choices) || event.choices.length === 0) {
    return null;
  }

  const handleChoice = (choiceIndex: number) => {
    onChoice(choiceIndex);
    onClose();
  };

  const getReputationColor = (change: number) => {
    if (change > 0) return 'text-green-400';
    if (change < 0) return 'text-red-400';
    return 'text-stone-400';
  };

  const formatReputationChange = (change: number) => {
    if (change > 0) return `+${change}`;
    return `${change}`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`📜 ${title}`}
      size="2xl"
      height="auto"
    >
      <div className="mb-6">
        <p className="text-stone-300 leading-relaxed whitespace-pre-line">
          {description}
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-md font-bold text-stone-200 mb-3">
          请做出你的选择：
        </h3>
        {event.choices.map((choice, index) => (
          <button
            key={index}
            onClick={() => handleChoice(index)}
            className="w-full p-4 bg-stone-900 hover:bg-stone-700 border border-stone-600 rounded-lg text-left transition-all hover:border-yellow-500"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-stone-200 font-medium mb-2">
                  {choice.text}
                </div>
                {choice.description && (
                  <div className="text-sm text-stone-400 mb-2">
                    {choice.description}
                  </div>
                )}
                <div className="flex items-center gap-4 text-xs">
                  <span className={getReputationColor(choice.reputationChange)}>
                    声望：{formatReputationChange(choice.reputationChange)}
                  </span>
                  {choice.hpChange !== undefined && choice.hpChange !== 0 && (
                    <span className={choice.hpChange > 0 ? 'text-green-400' : 'text-red-400'}>
                      气血：{choice.hpChange > 0 ? '+' : ''}{choice.hpChange}
                    </span>
                  )}
                  {choice.expChange !== undefined && choice.expChange !== 0 && (
                    <span className="text-blue-400">
                      修为：{choice.expChange > 0 ? '+' : ''}{choice.expChange}
                    </span>
                  )}
                  {choice.spiritStonesChange !== undefined && choice.spiritStonesChange !== 0 && (
                    <span className="text-yellow-400">
                      灵石：{choice.spiritStonesChange > 0 ? '+' : ''}{choice.spiritStonesChange}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </Modal>
  );
};

export default ReputationEventModal;
