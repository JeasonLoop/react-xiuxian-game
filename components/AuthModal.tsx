import React, { useState } from 'react';
import { apiService } from '../services/apiService';
import Modal from './common/Modal';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLoginMode) {
        await apiService.login(username, password);
      } else {
        await apiService.register(username, password, email, nickname);
      }
      onLoginSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isLoginMode ? '登录账号' : '注册账号'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-900/50 text-red-200 p-2 rounded text-sm border border-red-700">
            {error}
          </div>
        )}

        <div>
          <label className="block text-gray-300 mb-1">用户名</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white focus:border-emerald-500 outline-none"
            required
            minLength={4}
          />
        </div>

        <div>
          <label className="block text-gray-300 mb-1">密码</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white focus:border-emerald-500 outline-none"
            required
            minLength={6}
          />
        </div>

        {!isLoginMode && (
          <>
            <div>
              <label className="block text-gray-300 mb-1">邮箱</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white focus:border-emerald-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-1">昵称</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white focus:border-emerald-500 outline-none"
                required
              />
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white py-2 rounded font-medium transition-colors"
        >
          {loading ? '处理中...' : (isLoginMode ? '登录' : '注册')}
        </button>

        <div className="text-center text-sm text-gray-400 mt-4">
          {isLoginMode ? '还没有账号？' : '已有账号？'}
          <button
            type="button"
            onClick={() => setIsLoginMode(!isLoginMode)}
            className="text-emerald-400 hover:text-emerald-300 ml-1 underline"
          >
            {isLoginMode ? '立即注册' : '去登录'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
