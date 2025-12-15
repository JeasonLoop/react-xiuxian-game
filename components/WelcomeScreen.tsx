import React, { useRef } from 'react';
import { Sparkles, Play, Upload } from 'lucide-react';
import logo from '../public/assets/images/logo.png';
import { SAVE_KEY } from '../utils/gameUtils';
import { showError, showConfirm } from '../utils/toastUtils';

interface Props {
  hasSave: boolean;
  onStart: () => void;
  onContinue: () => void;
}

const WelcomeScreen: React.FC<Props> = ({ hasSave, onStart, onContinue }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportSave = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 支持 .json 和 .txt 文件
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.json') && !fileName.endsWith('.txt')) {
      showError('请选择 .json 或 .txt 格式的存档文件！');
      return;
    }

    try {
      const text = await file.text();
      let saveData;

      // 尝试解析JSON
      try {
        saveData = JSON.parse(text);
      } catch (parseError) {
        showError('存档文件格式错误！请确保文件内容是有效的JSON格式。');
        console.error('JSON解析错误:', parseError);
        return;
      }

      // 验证存档数据结构
      if (!saveData || typeof saveData !== 'object') {
        showError('存档文件格式不正确！文件内容必须是有效的JSON对象。');
        return;
      }

      if (!saveData.player || typeof saveData.player !== 'object') {
        showError('存档文件格式不正确！缺少必要的玩家数据。');
        return;
      }

      if (!Array.isArray(saveData.logs)) {
        showError('存档文件格式不正确！日志数据必须是数组格式。');
        return;
      }

      // 显示存档信息预览
      const playerName = saveData.player.name || '未知';
      const realm = saveData.player.realm || '未知';
      const timestamp = saveData.timestamp
        ? new Date(saveData.timestamp).toLocaleString('zh-CN')
        : '未知';

      onContinue();
      // 确认导入
      showConfirm(
        `确定要导入此存档吗？\n\n玩家名称: ${playerName}\n境界: ${realm}\n保存时间: ${timestamp}\n\n当前存档将被替换，页面将自动刷新。`,
        '确认导入',
        () => {
          try {
            // 保存到localStorage
            localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));

            // 直接刷新页面，不需要再次确认
            // 延迟一小段时间让用户看到操作完成
            setTimeout(() => {
              window.location.reload();
            }, 100);
          } catch (error) {
            console.error('保存存档失败:', error);
            showError('保存存档失败，请重试！');
          }
        }
      );
    } catch (error) {
      console.error('导入存档失败:', error);
      showError(
        `导入存档失败！错误信息: ${error instanceof Error ? error.message : '未知错误'}，请检查文件格式是否正确。`
      );
    }

    // 清空文件输入，以便可以重复选择同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 flex items-center justify-center z-50 overflow-hidden touch-manipulation">
      {/* 背景装饰 */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(203,161,53,0.1),transparent_70%)]" />
      </div>

      {/* 主要内容区域 */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full p-3 sm:p-4 md:p-6 lg:p-8">
        {/* Logo 图片 */}
        <div className="mb-4 sm:mb-6 md:mb-8 lg:mb-12 animate-fade-in">
          <div className="relative">
            <img
              src={logo}
              alt="云灵修仙传"
              className="w-[70vw] max-w-[280px] sm:w-[60vw] sm:max-w-[400px] md:max-w-[500px] lg:max-w-[600px] h-auto max-h-[30vh] sm:max-h-[35vh] md:max-h-[40vh] lg:max-h-[400px] object-contain drop-shadow-2xl relative z-10 animate-glow-pulse"
            />
            {/* 光晕效果 */}
            {/* 光晕效果 */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[115%] aspect-square -z-10 opacity-20 sm:opacity-85 pointer-events-none">
              <div
                className="w-full h-full animate-glow-pulse blur-2xl sm:blur-3xl"
                style={{
                  background:
                    'radial-gradient(circle, rgba(203, 161, 53, 0.6) 0%, transparent 70%)',
                }}
              />
            </div>
          </div>
        </div>

        {/* 游戏标题 */}
        <div
          className="text-center mb-4 sm:mb-6 md:mb-8 lg:mb-12 px-4 animate-fade-in"
          style={{ animationDelay: '0.2s' }}
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-serif font-bold text-mystic-gold tracking-wide sm:tracking-wider md:tracking-widest mb-2 sm:mb-3 md:mb-4 drop-shadow-lg">
            云灵修仙传
          </h1>
          <p className="text-stone-400 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-light px-2">
            踏上你的长生之路
          </p>
        </div>

        {/* 游戏按钮 */}
        <div
          className="animate-fade-in flex flex-col gap-2 sm:gap-3 md:gap-4 w-full max-w-xs sm:max-w-sm md:max-w-md px-4 sm:px-0"
          style={{ animationDelay: '0.4s' }}
        >
          {/* 隐藏的文件输入 */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.txt"
            onChange={handleImportSave}
            className="hidden"
          />

          {hasSave ? (
            // 有存档：显示继续游戏和新游戏按钮
            <>
              <button
                onClick={onContinue}
                className="group relative px-4 sm:px-6 md:px-8 lg:px-12 py-3 sm:py-3.5 md:py-4 lg:py-5 bg-gradient-to-r from-mystic-jade to-green-600 text-stone-900 font-bold text-sm sm:text-base md:text-lg lg:text-xl rounded-lg transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105 active:scale-95 flex items-center justify-center gap-2 sm:gap-3 min-h-[50px] sm:min-h-[55px] md:min-h-[60px] lg:min-h-[70px] touch-manipulation overflow-hidden"
              >
                {/* 按钮光效 */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                <Play
                  size={20}
                  className="sm:w-6 sm:h-6 md:w-7 md:h-7 relative z-10 flex-shrink-0"
                />
                <span className="relative z-10 whitespace-nowrap">
                  继续游戏
                </span>
              </button>
              <button
                onClick={onStart}
                className="group relative px-4 sm:px-6 md:px-8 lg:px-12 py-2.5 sm:py-3 md:py-4 lg:py-5 bg-gradient-to-r from-stone-600 to-stone-700 text-stone-200 font-bold text-xs sm:text-sm md:text-base lg:text-lg rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center gap-2 sm:gap-3 min-h-[45px] sm:min-h-[50px] md:min-h-[55px] lg:min-h-[60px] touch-manipulation overflow-hidden border border-stone-500"
              >
                {/* 按钮光效 */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                <Sparkles
                  size={18}
                  className="sm:w-5 sm:h-5 md:w-6 md:h-6 relative z-10 flex-shrink-0"
                />
                <span className="relative z-10 whitespace-nowrap">新游戏</span>
              </button>
              <button
                onClick={handleImportClick}
                className="group relative px-4 sm:px-6 md:px-8 lg:px-12 py-2.5 sm:py-3 md:py-4 lg:py-5 bg-gradient-to-r from-stone-500 to-stone-600 text-stone-200 font-bold text-xs sm:text-sm md:text-base lg:text-lg rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center gap-2 sm:gap-3 min-h-[45px] sm:min-h-[50px] md:min-h-[55px] lg:min-h-[60px] touch-manipulation overflow-hidden border border-stone-500"
              >
                {/* 按钮光效 */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                <Upload
                  size={18}
                  className="sm:w-5 sm:h-5 md:w-6 md:h-6 relative z-10 flex-shrink-0"
                />
                <span className="relative z-10 whitespace-nowrap">导入存档</span>
              </button>
            </>
          ) : (
            // 没有存档：显示开始游戏和导入存档按钮
            <>
              <button
                onClick={onStart}
                className="group relative px-4 sm:px-6 md:px-8 lg:px-12 py-3 sm:py-3.5 md:py-4 lg:py-5 bg-gradient-to-r from-mystic-gold to-yellow-600 text-stone-900 font-bold text-sm sm:text-base md:text-lg lg:text-xl rounded-lg transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105 active:scale-95 flex items-center justify-center gap-2 sm:gap-3 min-h-[50px] sm:min-h-[55px] md:min-h-[60px] lg:min-h-[70px] touch-manipulation overflow-hidden"
              >
                {/* 按钮光效 */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                <Sparkles
                  size={20}
                  className="sm:w-6 sm:h-6 md:w-7 md:h-7 relative z-10 flex-shrink-0"
                />
                <span className="relative z-10 whitespace-nowrap">开始游戏</span>
              </button>
              <button
                onClick={handleImportClick}
                className="group relative px-4 sm:px-6 md:px-8 lg:px-12 py-2.5 sm:py-3 md:py-4 lg:py-5 bg-gradient-to-r from-stone-500 to-stone-600 text-stone-200 font-bold text-xs sm:text-sm md:text-base lg:text-lg rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center gap-2 sm:gap-3 min-h-[45px] sm:min-h-[50px] md:min-h-[55px] lg:min-h-[60px] touch-manipulation overflow-hidden border border-stone-500"
              >
                {/* 按钮光效 */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                <Upload
                  size={18}
                  className="sm:w-5 sm:h-5 md:w-6 md:h-6 relative z-10 flex-shrink-0"
                />
                <span className="relative z-10 whitespace-nowrap">导入存档</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
