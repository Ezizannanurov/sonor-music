'use client';

import React from 'react';
import { Compass, Flame, Moon, Laptop, Gamepad2, Zap, Radio, Coffee } from 'lucide-react';

export interface MoodCategory {
  id: string;
  name: string;
  query: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
}

export const MOOD_CATEGORIES: MoodCategory[] = [
  {
    id: 'drift',
    name: 'Дрифт & Фонк',
    query: 'Phonk Drift Bass Russian Phonk',
    description: 'Плотный бас и агрессивный ритм',
    icon: <Flame className="w-4 h-4 text-red-400" />,
    gradient: 'from-red-950/80 via-zinc-900 to-zinc-950 hover:border-red-500/40',
  },
  {
    id: 'gaming',
    name: 'Гейминг & OST',
    query: 'FNF Smoke Em Out Struggle OST Hazy River Toby Fox',
    description: 'Легендарные саундтреки и ремиксы',
    icon: <Gamepad2 className="w-4 h-4 text-emerald-400" />,
    gradient: 'from-emerald-950/80 via-zinc-900 to-zinc-950 hover:border-emerald-500/40',
  },
  {
    id: 'focus',
    name: 'Фокус & Кодинг',
    query: 'Deep Focus Coding Ambient Electronic',
    description: 'Чистый поток для концентрации',
    icon: <Laptop className="w-4 h-4 text-blue-400" />,
    gradient: 'from-blue-950/80 via-zinc-900 to-zinc-950 hover:border-blue-500/40',
  },
  {
    id: 'night',
    name: 'Ночной Чилл',
    query: 'Night Chill Lofi Relax Slowed',
    description: 'Атмосферный саунд поздней ночи',
    icon: <Moon className="w-4 h-4 text-indigo-400" />,
    gradient: 'from-indigo-950/80 via-zinc-900 to-zinc-950 hover:border-indigo-500/40',
  },
  {
    id: 'workout',
    name: 'Энергия & Спорт',
    query: 'Workout Rock Gym Motivation Energy',
    description: 'Максимальный заряд для тренировок',
    icon: <Zap className="w-4 h-4 text-amber-400" />,
    gradient: 'from-amber-950/80 via-zinc-900 to-zinc-950 hover:border-amber-500/40',
  },
  {
    id: 'synth',
    name: 'Синтвейв 80-х',
    query: 'Synthwave Retrowave 80s Cyberpunk',
    description: 'Неоновые синтезаторы и ретро-вайб',
    icon: <Radio className="w-4 h-4 text-pink-400" />,
    gradient: 'from-pink-950/80 via-zinc-900 to-zinc-950 hover:border-pink-500/40',
  },
  {
    id: 'acoustic',
    name: 'Уют & Акустика',
    query: 'Acoustic Indie Warm Soul Coffee',
    description: 'Тёплые ламповые гитарные треки',
    icon: <Coffee className="w-4 h-4 text-orange-400" />,
    gradient: 'from-orange-950/80 via-zinc-900 to-zinc-950 hover:border-orange-500/40',
  },
];

interface HomeMoodGridProps {
  activeMood: string | null;
  onSelectMood: (mood: MoodCategory) => void;
}

export const HomeMoodGrid: React.FC<HomeMoodGridProps> = ({ activeMood, onSelectMood }) => {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-violet-400" />
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
            По настроению и жанрам
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-2.5">
        {MOOD_CATEGORIES.map((mood) => {
          const isActive = activeMood === mood.id;

          return (
            <button
              key={mood.id}
              type="button"
              onClick={() => onSelectMood(mood)}
              className={`p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer active:scale-95 flex flex-col justify-between bg-gradient-to-br ${mood.gradient} ${
                isActive
                  ? 'border-white/40 ring-1 ring-white/30 shadow-lg'
                  : 'border-white/10'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-1.5 rounded-xl bg-white/10 backdrop-blur-md">
                  {mood.icon}
                </div>
                {isActive && (
                  <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_#ffffff]" />
                )}
              </div>

              <div>
                <div className="text-xs sm:text-sm font-bold text-white tracking-tight leading-snug">
                  {mood.name}
                </div>
                <div className="text-[10px] sm:text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                  {mood.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
