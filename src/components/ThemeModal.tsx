'use client';

import React, { useState } from 'react';
import { X, Check, Palette, Sparkles, RotateCcw } from 'lucide-react';

export interface ThemePreset {
  id: string;
  name: string;
  color: string;
  glow: string;
  subtle: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'indigo',
    name: 'Cyber Indigo',
    color: '#6366f1',
    glow: 'rgba(99, 102, 241, 0.45)',
    subtle: 'rgba(99, 102, 241, 0.12)',
  },
  {
    id: 'emerald',
    name: 'Spotify Emerald',
    color: '#10b981',
    glow: 'rgba(16, 185, 129, 0.45)',
    subtle: 'rgba(16, 185, 129, 0.12)',
  },
  {
    id: 'crimson',
    name: 'Ruby Crimson',
    color: '#ef4444',
    glow: 'rgba(239, 68, 68, 0.45)',
    subtle: 'rgba(239, 68, 68, 0.12)',
  },
  {
    id: 'cyan',
    name: 'Cyan Laser',
    color: '#06b6d4',
    glow: 'rgba(6, 182, 212, 0.45)',
    subtle: 'rgba(6, 182, 212, 0.12)',
  },
  {
    id: 'amber',
    name: 'Sunset Amber',
    color: '#f97316',
    glow: 'rgba(249, 115, 22, 0.45)',
    subtle: 'rgba(249, 115, 22, 0.12)',
  },
  {
    id: 'fuchsia',
    name: 'Sakura Fuchsia',
    color: '#ec4899',
    glow: 'rgba(236, 72, 153, 0.45)',
    subtle: 'rgba(236, 72, 153, 0.12)',
  },
  {
    id: 'gold',
    name: 'Electric Gold',
    color: '#eab308',
    glow: 'rgba(234, 179, 8, 0.45)',
    subtle: 'rgba(234, 179, 8, 0.12)',
  },
  {
    id: 'purple',
    name: 'Deep Purple',
    color: '#a855f7',
    glow: 'rgba(168, 85, 247, 0.45)',
    subtle: 'rgba(168, 85, 247, 0.12)',
  },
  {
    id: 'silver',
    name: 'Platinum Minimal',
    color: '#ffffff',
    glow: 'rgba(255, 255, 255, 0.35)',
    subtle: 'rgba(255, 255, 255, 0.12)',
  },
];

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentColor: string;
  onSelectColor: (color: string) => void;
}

export default function ThemeModal({
  isOpen,
  onClose,
  currentColor,
  onSelectColor,
}: ThemeModalProps) {
  const [customHex, setCustomHex] = useState(currentColor);

  if (!isOpen) return null;

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomHex(val);
    onSelectColor(val);
  };

  const isPresetActive = (color: string) =>
    currentColor.toLowerCase() === color.toLowerCase();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-zinc-950/95 backdrop-blur-2xl border border-white/15 rounded-3xl p-6 shadow-[0_25px_70px_rgba(0,0,0,0.85)] flex flex-col gap-5 text-zinc-100 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div
          className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-20 rounded-full blur-3xl pointer-events-none opacity-40 transition-all duration-500"
          style={{ backgroundColor: currentColor }}
        />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg"
              style={{
                backgroundColor: currentColor,
                boxShadow: `0 0 20px ${currentColor}70`,
              }}
            >
              <Palette className="w-5 h-5 text-black stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Цвет интерфейса
              </h3>
              <p className="text-xs text-zinc-400">
                Свечение плеера, навигация и WebGL лазер
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition"
            title="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preset Colors Section */}
        <div className="flex flex-col gap-2.5 relative z-10">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Готовые палитры
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {THEME_PRESETS.map((preset) => {
              const active = isPresetActive(preset.color);
              return (
                <button
                  key={preset.id}
                  onClick={() => {
                    setCustomHex(preset.color);
                    onSelectColor(preset.color);
                  }}
                  type="button"
                  className={`group relative flex items-center gap-2.5 p-2.5 rounded-2xl border transition-all duration-200 text-left ${
                    active
                      ? 'bg-white/15 border-white/35 shadow-[0_0_15px_rgba(255,255,255,0.12)] scale-[1.02]'
                      : 'bg-zinc-900/70 hover:bg-white/10 border-white/5 hover:border-white/15'
                  }`}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 shadow-sm"
                    style={{
                      backgroundColor: preset.color,
                      boxShadow: active ? `0 0 10px ${preset.color}` : 'none',
                    }}
                  >
                    {active && (
                      <Check className="w-3.5 h-3.5 text-black stroke-[3]" />
                    )}
                  </div>
                  <span className="text-xs font-medium text-zinc-200 truncate">
                    {preset.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Color Picker Section */}
        <div className="flex flex-col gap-2.5 pt-2 border-t border-white/10 relative z-10">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Свой оттенок (любой цвет)
          </label>
          <div className="flex items-center gap-3 bg-zinc-900/90 p-3 rounded-2xl border border-white/10">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden cursor-pointer flex-shrink-0 border border-white/20 shadow-md">
              <input
                type="color"
                value={customHex.startsWith('#') ? customHex : '#6366f1'}
                onChange={handleCustomChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                title="Выберите свой цвет"
              />
              <div
                className="w-full h-full"
                style={{
                  backgroundColor: customHex,
                  boxShadow: `inset 0 0 12px rgba(0,0,0,0.5)`,
                }}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white tracking-wide font-mono">
                {customHex.toUpperCase()}
              </div>
              <div className="text-xs text-zinc-400">
                Нажмите на квадрат, чтобы выбрать цвет в палитре
              </div>
            </div>

            <button
              onClick={() => {
                const defaultColor = '#6366f1';
                setCustomHex(defaultColor);
                onSelectColor(defaultColor);
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition flex items-center gap-1.5 flex-shrink-0"
              title="Сбросить на Cyber Indigo"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Сброс</span>
            </button>
          </div>
        </div>

        {/* Live Preview Sample */}
        <div
          className="p-3.5 rounded-2xl border transition-all duration-300 flex items-center justify-between relative z-10"
          style={{
            backgroundColor: `${currentColor}12`,
            borderColor: `${currentColor}40`,
            boxShadow: `0 0 25px ${currentColor}20`,
          }}
        >
          <div className="flex items-center gap-2.5 text-xs font-medium text-zinc-200">
            <Sparkles className="w-4 h-4" style={{ color: currentColor }} />
            <span>Предпросмотр темы интерфейса</span>
          </div>
          <div
            className="px-3 py-1 rounded-full text-xs font-semibold text-black shadow-md transition-all"
            style={{
              backgroundColor: currentColor,
              boxShadow: `0 0 12px ${currentColor}80`,
            }}
          >
            Акцент
          </div>
        </div>
      </div>
    </div>
  );
}
