'use client';

import React, { useState, useRef, useEffect } from 'react';
import { User as UserIcon, LogOut, ListMusic, Heart, Palette, Sparkles, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface UserMenuProps {
  onOpenThemeModal: () => void;
  onNavigateToPlaylists: () => void;
  onNavigateToFavorites: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({
  onOpenThemeModal,
  onNavigateToPlaylists,
  onNavigateToFavorites,
}) => {
  const { user, openAuthModal, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close when clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!user) {
    return (
      <button
        type="button"
        onClick={openAuthModal}
        className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition active:scale-95 shadow-md"
      >
        <UserIcon className="w-3.5 h-3.5 stroke-[2.5]" />
        <span>Войти</span>
      </button>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full bg-zinc-900/90 hover:bg-zinc-800 border border-white/10 transition active:scale-95 shadow-sm"
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm flex-shrink-0"
          style={{ background: user.avatar }}
        >
          {user.username.charAt(0).toUpperCase()}
        </div>
        <span className="text-xs font-semibold text-zinc-200 truncate max-w-[90px] sm:max-w-[120px]">
          {user.username}
        </span>
        <ChevronDown className="w-3 h-3 text-zinc-400" />
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-zinc-950/98 backdrop-blur-2xl border border-white/15 rounded-2xl p-2 shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-50 animate-fadeIn text-zinc-200 text-xs">
          {/* User Info Header */}
          <div className="p-2.5 pb-3 border-b border-white/10 flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm flex-shrink-0"
              style={{ background: user.avatar }}
            >
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="truncate">
              <div className="font-bold text-white truncate text-xs">
                {user.username}
              </div>
              <div className="text-[11px] text-zinc-400 truncate mt-0.5">
                {user.email}
              </div>
            </div>
          </div>

          <div className="py-1 space-y-0.5">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onNavigateToPlaylists();
              }}
              className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/10 text-left transition"
            >
              <ListMusic className="w-4 h-4 text-zinc-400" />
              <span>Мои плейлисты</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onNavigateToFavorites();
              }}
              className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/10 text-left transition"
            >
              <Heart className="w-4 h-4 text-red-400" />
              <span>Любимые треки</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenThemeModal();
              }}
              className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/10 text-left transition"
            >
              <Palette className="w-4 h-4 text-[var(--accent-color,#6366f1)]" />
              <span>Цвет оформления</span>
            </button>
          </div>

          <div className="pt-1 border-t border-white/10">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-red-500/15 text-red-400 hover:text-red-300 text-left transition font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span>Выйти из аккаунта</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
