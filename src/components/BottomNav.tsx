'use client';

import React from 'react';
import { Home, Search, Library } from 'lucide-react';
import GlassSurface from './GlassSurface';

export type NavTab = 'home' | 'search' | 'library';

interface BottomNavProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  isVisible?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange, isVisible = true }) => {
  if (!isVisible) {
    return null;
  }

  const tabs: { value: NavTab; label: string; icon: React.ReactNode }[] = [
    {
      value: 'home',
      label: 'Главная',
      icon: <Home className="w-4 h-4" />,
    },
    {
      value: 'search',
      label: 'Поиск',
      icon: <Search className="w-4 h-4" />,
    },
    {
      value: 'library',
      label: 'Медиатека',
      icon: <Library className="w-4 h-4" />,
    },
  ];

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 p-2 sm:p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] pointer-events-none flex justify-center transition-all duration-300 ease-out ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-28 opacity-0 pointer-events-none'
      }`}
    >
      <div className="pointer-events-auto shadow-[0_10px_35px_rgba(0,0,0,0.7)] rounded-full">
        <GlassSurface
          borderRadius={36}
          borderWidth={0.06}
          brightness={55}
          opacity={0.9}
          blur={14}
          displace={1}
          backgroundOpacity={0.15}
          saturation={1.8}
          distortionScale={-140}
          redOffset={4}
          greenOffset={12}
          blueOffset={20}
          className="rounded-full border border-white/10"
        >
          <nav className="flex items-center gap-1 px-1.5 py-1">
            {tabs.map((tab) => {
              const isActive = currentTab === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => onTabChange(tab.value)}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 select-none ${
                    isActive
                      ? 'text-white bg-white/15 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)] border'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent'
                  } active:scale-95`}
                  style={
                    isActive
                      ? {
                          borderColor: 'var(--accent-color, rgba(255,255,255,0.3))',
                          boxShadow: '0 0 14px var(--accent-glow, rgba(255,255,255,0.15))',
                        }
                      : undefined
                  }
                >
                  <span style={isActive ? { color: 'var(--accent-color, #ffffff)' } : undefined}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </GlassSurface>
      </div>
    </div>
  );
};
