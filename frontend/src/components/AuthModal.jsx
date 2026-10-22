import React, { useState } from 'react';
import { X, LogIn, UserPlus, AlertCircle, Loader2, Zap, Lock, Mail, User } from 'lucide-react';
import { api } from '../services/api';

export default function AuthModal({ isOpen, initialMode = 'login', onClose, onAuthSuccess }) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let data;
      if (mode === 'login') {
        data = await api.login(email.trim(), password);
      } else {
        data = await api.register(name.trim(), email.trim(), password);
      }

      if (data.token) {
        localStorage.setItem('cg_token', data.token);
        localStorage.setItem('cg_user', JSON.stringify(data.user));
        onAuthSuccess(data.user, data.token);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setMode('login');
    setEmail('demo@codegraph.dev');
    setPassword('codegraph123');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4">
      <div className="bg-white rounded-lg border border-gh-border shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Top Header */}
        <div className="px-5 py-3.5 border-b border-gh-borderSubtle flex items-center justify-between bg-gh-canvas">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded bg-gh-text text-white flex items-center justify-center font-bold text-xs shadow-xs">
              CG
            </div>
            <h3 className="font-semibold text-gh-text text-sm">
              {mode === 'login' ? 'Sign in to CodeGraph' : 'Create your account'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gh-textMuted hover:text-gh-text p-1 rounded-md hover:bg-gh-subtle transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Auth Mode Toggle Tabs */}
        <div className="flex border-b border-gh-borderSubtle bg-gh-canvas/40 text-xs font-medium">
          <button
            onClick={() => {
              setMode('login');
              setError('');
            }}
            className={`flex-1 py-2 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
              mode === 'login'
                ? 'border-gh-blue text-gh-blue font-semibold bg-white'
                : 'border-transparent text-gh-textMuted hover:text-gh-text'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign in</span>
          </button>
          <button
            onClick={() => {
              setMode('register');
              setError('');
            }}
            className={`flex-1 py-2 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
              mode === 'register'
                ? 'border-gh-blue text-gh-blue font-semibold bg-white'
                : 'border-transparent text-gh-textMuted hover:text-gh-text'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Register</span>
          </button>
        </div>

        {/* Modal Form */}
        <div className="p-5">
          {error && (
            <div className="mb-4 p-2.5 rounded-md bg-gh-redLight border border-gh-red/30 text-gh-red text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-gh-text mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-gh-textMuted absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Ada Lovelace"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-gh-border rounded-md focus:outline-none focus:border-gh-blue bg-white"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gh-text mb-1">
                Email address
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-gh-textMuted absolute left-2.5 top-2.5" />
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-gh-border rounded-md focus:outline-none focus:border-gh-blue bg-white"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-gh-text">
                  Password
                </label>
                {mode === 'register' && (
                  <span className="text-[10px] text-gh-textMuted">min 6 chars</span>
                )}
              </div>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-gh-textMuted absolute left-2.5 top-2.5" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-gh-border rounded-md focus:outline-none focus:border-gh-blue bg-white font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-gh-green hover:bg-[#1a7f37]/90 text-white font-semibold rounded-md shadow-sm transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-50 text-xs mt-2"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{mode === 'login' ? 'Sign in' : 'Create account'}</span>
            </button>
          </form>

          {/* Quick Demo Helper */}
          <div className="mt-4 pt-3 border-t border-gh-borderSubtle flex items-center justify-between text-[11px]">
            <span className="text-gh-textMuted">Evaluation testing:</span>
            <button
              type="button"
              onClick={handleFillDemo}
              className="text-gh-blue hover:text-gh-blueHover hover:underline font-medium flex items-center gap-1"
            >
              <Zap className="w-3 h-3 text-gh-orange fill-gh-orange" />
              <span>Fill Demo Credentials</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
