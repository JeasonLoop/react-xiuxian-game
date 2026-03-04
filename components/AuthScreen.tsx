import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { cloudSaveService } from '../services/cloudSaveService';
import { useGameStore } from '../store/gameStore';
import { API_URL } from '../constants/api';
import { User, Lock, Sparkles, LogIn, UserPlus } from 'lucide-react';
import logo from '../public/assets/images/logo.png';

export const AuthScreen: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      if (isLogin) {
        const refreshToken = data.refreshToken ?? data.token;
        login(data.token, refreshToken, data.user);

        try {
          const cloudSave = await cloudSaveService.fetchSave();
          if (cloudSave) {
            useGameStore.getState().loadGame(cloudSave);
          }
        } catch (saveErr) {
          console.error('Failed to load cloud save:', saveErr);
        }
      } else {
        // Registration successful, switch to login
        setIsLogin(true);
        setError('注册成功，请登录');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 flex items-center justify-center z-50 overflow-hidden touch-manipulation p-4">
      {/* 背景装饰 */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(203,161,53,0.1),transparent_70%)]" />
      </div>

      <div className="relative z-10 w-full max-w-md animate-fade-in">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-4">
            <img
              src={logo}
              alt="云灵修仙传"
              className="w-32 h-32 object-contain drop-shadow-2xl relative z-10 animate-glow-pulse mx-auto"
            />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] aspect-square -z-10 opacity-40 pointer-events-none">
              <div
                className="w-full h-full animate-glow-pulse blur-2xl"
                style={{
                  background: 'radial-gradient(circle, rgba(203, 161, 53, 0.6) 0%, transparent 70%)',
                }}
              />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-mystic-gold tracking-widest mb-2 drop-shadow-lg">
            云灵修仙传
          </h1>
          <p className="text-stone-400 text-sm md:text-base font-light">
            {isLogin ? '欢迎归位，道友' : '开启你的长生之路'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-stone-800/80 backdrop-blur-md border-2 border-mystic-gold/30 rounded-xl p-6 md:p-8 shadow-2xl relative overflow-hidden group">
          {/* 装饰边角 */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-mystic-gold/50 rounded-tl-lg" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-mystic-gold/50 rounded-tr-lg" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-mystic-gold/50 rounded-bl-lg" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-mystic-gold/50 rounded-br-lg" />

          <h2 className="text-xl font-serif font-bold mb-6 text-center text-mystic-gold flex items-center justify-center gap-2">
            {isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
            {isLogin ? '道友请登录' : '新道友注册'}
          </h2>
          
          {error && (
            <div className={`mb-6 p-3 rounded border text-sm flex items-center gap-2 ${
              error.includes('成功') 
                ? 'bg-green-900/30 border-green-500/50 text-green-400' 
                : 'bg-red-900/30 border-red-500/50 text-red-400'
            }`}>
              <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-stone-400 uppercase tracking-wider flex items-center gap-2">
                <User size={14} />
                道号 (用户名)
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-stone-900/50 border border-stone-700 rounded-lg focus:outline-none focus:border-mystic-gold focus:ring-1 focus:ring-mystic-gold/30 text-stone-100 transition-all placeholder-stone-600"
                placeholder="请输入道号"
                required
                minLength={3}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-semibold text-stone-400 uppercase tracking-wider flex items-center gap-2">
                <Lock size={14} />
                真言 (密码)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-stone-900/50 border border-stone-700 rounded-lg focus:outline-none focus:border-mystic-gold focus:ring-1 focus:ring-mystic-gold/30 text-stone-100 transition-all placeholder-stone-600"
                placeholder="请输入真言"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-mystic-gold to-yellow-600 hover:from-yellow-600 hover:to-mystic-gold text-stone-900 font-bold rounded-lg transition-all duration-300 shadow-lg hover:shadow-mystic-gold/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles size={18} />
                  {isLogin ? '踏入修仙界' : '立下长生誓'}
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-stone-400 hover:text-mystic-gold text-sm transition-colors flex items-center justify-center gap-2 mx-auto group"
            >
              <div className="h-px w-8 bg-stone-700 group-hover:bg-mystic-gold/30 transition-all" />
              {isLogin ? '初入此界？点击注册' : '已有道号？点击登录'}
              <div className="h-px w-8 bg-stone-700 group-hover:bg-mystic-gold/30 transition-all" />
            </button>
          </div>
        </div>

        {/* Footer Info */}
        <p className="mt-8 text-center text-stone-500 text-xs tracking-widest uppercase">
          云灵修仙传 · 存档云端同步
        </p>
      </div>
    </div>
  );
};
