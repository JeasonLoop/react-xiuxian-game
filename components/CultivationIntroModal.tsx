import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const CultivationIntroModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const text = '我辈修士，夺天地造化，现传法如下；吸天地之灵以御其气；假天地之奇以筑道基；窥天地之法以炼金丹；夺天地之精以成元婴；抽天地之髓以得其神；祭天地之魄以身合道；逆天地之理以证长生；';

  // 将文本按分号分割成句子
  const sentences = text.split('；');

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setCurrentIndex(0);
    } else {
      setIsVisible(false);
      setCurrentIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !isVisible) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev < sentences.length - 1) {
          return prev + 1;
        }
        clearInterval(timer);
        return prev;
      });
    }, 1000); // 每1000ms显示一句

    return () => clearInterval(timer);
  }, [isOpen, isVisible, sentences.length]);

  if (!isOpen || !isVisible) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[10000] p-4"
      onClick={onClose}
    >
      <div
        className="bg-stone-800 rounded-lg border border-stone-600 shadow-lg max-w-3xl w-full p-6 md:p-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-white transition-colors"
          aria-label="关闭"
        >
          <X size={20} />
        </button>

        {/* 标题 */}
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-stone-200">
            修仙法门
          </h2>
        </div>

        {/* 内容区域 */}
        <div className="space-y-4">
          {sentences.map((sentence, index) => {
            const shouldShow = index <= currentIndex;

            return (
              <div
                key={index}
                className={`transition-all duration-500 ${
                  shouldShow
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-4'
                }`}
              >
                <p
                  className={`text-lg md:text-xl font-serif text-center leading-relaxed ${
                    shouldShow ? 'text-stone-300' : 'text-stone-600'
                  }`}
                >
                  {sentence}
                  {index < sentences.length - 1 && '；'}
                </p>
              </div>
            );
          })}
        </div>

        {/* 底部提示 */}
        {currentIndex >= sentences.length - 1 && (
          <div className="mt-6 text-center">
            <p className="text-stone-500 text-sm">
              点击任意位置关闭
            </p>
          </div>
        )}

        {/* 引用信息 */}
        <div className="mt-4 text-right">
          <p className="text-stone-500 text-xs">
            ---出自《我的模拟长生路》
          </p>
        </div>
      </div>
    </div>
  );
};

export default CultivationIntroModal;

