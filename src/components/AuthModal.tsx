'use client';

import React, { useState } from 'react';
import { X, User as UserIcon, Lock, Mail, Sparkles, Check, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const AVATAR_PRESETS = [
  'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
  'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
  'linear-gradient(135deg, #f97316 0%, #ef4444 100%)',
  'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
  'linear-gradient(135deg, #eab308 0%, #f97316 100%)',
  'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
];

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, login, register, quickDemoLogin } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>('login');

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (tab === 'login') {
        const res = await login(email || username, password);
        if (!res.success) {
          setError(res.error || 'Ошибка входа');
        }
      } else {
        const res = await register(username, email, password, selectedAvatar);
        if (!res.success) {
          setError(res.error || 'Ошибка регистрации');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={closeAuthModal}
    >
      <div
        className="w-full max-w-md bg-zinc-950/95 backdrop-blur-2xl border border-white/15 rounded-3xl p-6 shadow-[0_25px_70px_rgba(0,0,0,0.85)] flex flex-col gap-5 text-zinc-100 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg"
              style={{
                background: 'var(--accent-color, #6366f1)',
                boxShadow: '0 0 20px var(--accent-glow, rgba(99,102,241,0.5))',
              }}
            >
              <UserIcon className="w-5 h-5 text-black stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                {tab === 'login' ? 'Вход в аккаунт' : 'Создать аккаунт'}
              </h3>
              <p className="text-xs text-zinc-400">
                Синхронизация плейлистов и любимых треков
              </p>
            </div>
          </div>

          <button
            onClick={closeAuthModal}
            className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-zinc-900 rounded-2xl border border-white/10">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition ${
              tab === 'login'
                ? 'bg-white text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Войти
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition ${
              tab === 'register'
                ? 'bg-white text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Регистрация
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center font-medium animate-fadeIn">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {tab === 'register' && (
            <>
              <div>
                <label className="text-xs text-zinc-400 block mb-1 font-medium">
                  Имя профиля
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    required
                    placeholder="Например, AlexMusic"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-zinc-900/90 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/25 transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1 font-medium">
                  Аватар
                </label>
                <div className="flex items-center gap-2">
                  {AVATAR_PRESETS.map((grad, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedAvatar(grad)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform ${
                        selectedAvatar === grad
                          ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-black'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ background: grad }}
                    >
                      {selectedAvatar === grad && (
                        <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div>
            <label className="text-xs text-zinc-400 block mb-1 font-medium">
              {tab === 'login' ? 'Email или Имя пользователя' : 'Email'}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type={tab === 'register' ? 'email' : 'text'}
                required
                placeholder={tab === 'login' ? 'demo@sonor.fm' : 'your@email.com'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-900/90 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/25 transition"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-400 block mb-1 font-medium">
              Пароль
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="password"
                required
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-900/90 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/25 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 mt-2 bg-white text-black font-semibold text-sm rounded-xl hover:bg-zinc-200 transition disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2 shadow-lg"
          >
            <span>{tab === 'login' ? 'Войти' : 'Создать аккаунт'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo 1-Click Login Option */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between">
          <span className="text-xs text-zinc-500">Для быстрого теста:</span>
          <button
            type="button"
            onClick={quickDemoLogin}
            className="text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            <span>Демо-вход (1 клик)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
