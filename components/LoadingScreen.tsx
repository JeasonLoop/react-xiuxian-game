import React from 'react';

/**
 * 加载屏幕组件
 * 显示游戏加载状态
 */
const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-linear-to-br from-stone-900 via-stone-800 to-stone-900 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mystic-gold mx-auto mb-4"></div>
        <p className="text-stone-400 text-lg">加载存档中...</p>
      </div>
    </div>
  );
};

export default LoadingScreen;

