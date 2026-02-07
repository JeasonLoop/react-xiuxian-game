import React, { useState } from 'react';
import { User, Lock, Mail, Github } from 'lucide-react';
import logo from '../public/assets/images/logo.png';
import { apiService } from '../services/apiService';
import { showError, showSuccess } from '../utils/toastUtils';

interface Props {
  onLoginSuccess: () => void;
}

const LoginPage: React.FC<Props> = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    nickname: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await apiService.login(formData.username, formData.password);
        showSuccess('登录成功！');
        onLoginSuccess();
      } else {
        if (formData.password !== formData.confirmPassword) {
          showError('两次输入的密码不一致！');
          setLoading(false);
          return;
        }
        await apiService.register(
          formData.username,
          formData.password,
          formData.email,
          formData.nickname || formData.username
        );
        showSuccess('注册成功！');
        onLoginSuccess();
      }
    } catch (error) {
      console.error(error);
      showError(error instanceof Error ? error.message : '操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 flex items-center justify-center z-50 p-4 overflow-y-auto touch-manipulation">
      {/* 背景装饰 */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(203,161,53,0.1),transparent_70%)]" />
      </div>

      <div className="bg-paper-800 border-2 border-mystic-gold rounded-lg p-6 md:p-8 max-w-md w-full shadow-2xl relative z-10 animate-fade-in">
        <div className="text-center mb-8">
          <img 
            src={logo} 
            alt="Logo" 
            className="w-24 h-24 mx-auto mb-4 object-contain drop-shadow-lg"
          />
          <h1 className="text-3xl font-serif font-bold text-mystic-gold tracking-widest mb-2">
            云灵修仙
          </h1>
          <p className="text-stone-400">
            {isLogin ? '道友请留步，登录以继续仙途' : '踏入仙途，开启长生之路'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-stone-300 mb-1 text-sm font-semibold">用户名</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" size={18} />
              <input
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                placeholder="请输入用户名"
                className="w-full pl-10 pr-4 py-2.5 bg-stone-700 border border-stone-600 rounded text-stone-200 focus:outline-none focus:border-mystic-jade focus:ring-1 focus:ring-mystic-jade"
              />
            </div>
          </div>

          {!isLogin && (
            <>
              <div>
                <label className="block text-stone-300 mb-1 text-sm font-semibold">昵称</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" size={18} />
                  <input
                    name="nickname"
                    type="text"
                    required
                    value={formData.nickname}
                    onChange={handleChange}
                    placeholder="请输入道号"
                    className="w-full pl-10 pr-4 py-2.5 bg-stone-700 border border-stone-600 rounded text-stone-200 focus:outline-none focus:border-mystic-jade focus:ring-1 focus:ring-mystic-jade"
                  />
                </div>
              </div>
              <div>
                <label className="block text-stone-300 mb-1 text-sm font-semibold">邮箱</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" size={18} />
                  <input
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="请输入邮箱"
                    className="w-full pl-10 pr-4 py-2.5 bg-stone-700 border border-stone-600 rounded text-stone-200 focus:outline-none focus:border-mystic-jade focus:ring-1 focus:ring-mystic-jade"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-stone-300 mb-1 text-sm font-semibold">密码</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" size={18} />
              <input
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="请输入密码"
                className="w-full pl-10 pr-4 py-2.5 bg-stone-700 border border-stone-600 rounded text-stone-200 focus:outline-none focus:border-mystic-jade focus:ring-1 focus:ring-mystic-jade"
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="block text-stone-300 mb-1 text-sm font-semibold">确认密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" size={18} />
                <input
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="请再次输入密码"
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-700 border border-stone-600 rounded text-stone-200 focus:outline-none focus:border-mystic-jade focus:ring-1 focus:ring-mystic-jade"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-mystic-gold to-yellow-600 text-stone-900 font-bold rounded hover:shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {loading ? '处理中...' : (isLogin ? '登 录' : '注 册')}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-paper-800 text-stone-400">第三方登录</span>
            </div>
          </div>

          <div className="mt-4">
            <button
              disabled
              className="w-full py-2.5 bg-stone-700 text-stone-400 font-semibold rounded border border-stone-600 flex items-center justify-center gap-2 cursor-not-allowed opacity-60"
              title="Linux.Do 登录即将上线"
            >
              <div className="w-5 h-5 flex items-center justify-center font-bold border border-current rounded-full text-xs">L</div>
              通过 Linux.Do 登录 (开发中)
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-stone-400 text-sm">
            {isLogin ? '还没有账号？' : '已有账号？'}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="ml-1 text-mystic-jade hover:underline font-semibold focus:outline-none"
            >
              {isLogin ? '立即注册' : '直接登录'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
