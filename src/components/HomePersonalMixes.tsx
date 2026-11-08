'use client';

import React from 'react';
import { Play, Sparkles, Disc3 } from 'lucide-react';

export interface PersonalMix {
  id: string;
  title: string;
  subtitle: string;
  artists: string;
  gradient: string;
  badgeColor: string;
  searchQuery: string;
}

export const PERSONAL_MIXES: PersonalMix[] = [
  {
    id: 'mix-1',
    title: 'Daily Mix 1',
    subtitle: 'Фонк & Дрифт',
    artists: 'Kordhell, DVRST, Hensonn, INTERWORLD',
    gradient: 'from-rose-600 via-red-900 to-black',
    badgeColor: '#e11d48',
    searchQuery: 'Phonk Drift Bass Kordhell DVRST',
  },
  {
    id: 'mix-2',
    title: 'Daily Mix 2',
    subtitle: 'Indie & Game OST',
    artists: 'Atsuover, Rageminer, Toby Fox, Kamex',
    gradient: 'from-emerald-600 via-teal-900 to-black',
    badgeColor: '#059669',
    searchQuery: 'FNF Smoke Em Out Struggle Atsuover Hazy River',
  },
  {
    id: 'mix-3',
    title: 'Daily Mix 3',
    subtitle: 'Cyberpunk & Synth',
    artists: 'Kavinsky, Perturbator, Carpenter Brut',
    gradient: 'from-cyan-600 via-blue-950 to-black',
    badgeColor: '#0284c7',
    searchQuery: 'Synthwave Cyberpunk Electronic Retro',
  },
  {
    id: 'mix-4',
    title: 'Chill Mix',
    subtitle: 'Ночной Чилл & Lo-Fi',
    artists: 'Kudasai, Potsu, Lofi Fruits, Jinsang',
    gradient: 'from-violet-600 via-purple-950 to-black',
    badgeColor: '#7c3aed',
    searchQuery: 'Lo-Fi Chill Beats Night Relax',
  },
  {
    id: 'mix-5',
    title: 'Energy Mix',
    subtitle: 'Тренировка & Драйв',
    artists: 'Ghostemane, Skillet, Mick Gordon, Bring Me The Horizon',
    gradient: 'from-amber-600 via-orange-950 to-black',
    badgeColor: '#d97706',
    searchQuery: 'Workout Rock Metal Gym Motivation',
  },
];

interface HomePersonalMixesProps {
  onSelectMix: (mix: PersonalMix) => void;
}

export const HomePersonalMixes: React.FC<HomePersonalMixesProps> = ({ onSelectMix }) => {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
            Персональные миксы
          </h2>
        </div>
        <span className="text-xs text-zinc-500 font-medium hidden sm:inline">
          Составлено под ваш вкус
        </span>
      </div>

      {/* Horizontal Swipeable Mix Cards */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory -mx-3 px-3 sm:mx-0 sm:px-0">
        {PERSONAL_MIXES.map((mix) => (
          <div
            key={mix.id}
            onClick={() => onSelectMix(mix)}
            className="group flex-shrink-0 w-40 sm:w-44 bg-zinc-900/70 hover:bg-zinc-800/80 border border-white/5 hover:border-white/20 rounded-2xl p-3 cursor-pointer transition-all duration-300 active:scale-[0.98] snap-start flex flex-col justify-between"
          >
            {/* Mix Cover Graphic */}
            <div
              className={`relative w-full aspect-square rounded-xl bg-gradient-to-br ${mix.gradient} p-3 flex flex-col justify-between overflow-hidden shadow-lg group-hover:shadow-2xl transition-shadow`}
            >
              {/* Top ambient gloss */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />

              {/* Badge */}
              <div className="flex items-center justify-between relative z-10">
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase text-white shadow-sm"
                  style={{ backgroundColor: mix.badgeColor }}
                >
                  {mix.title}
                </span>
                <Disc3 className="w-4 h-4 text-white/60 group-hover:rotate-45 transition-transform duration-500" />
              </div>

              {/* Center Title in cover */}
              <div className="relative z-10 my-auto">
                <div className="text-sm sm:text-base font-black text-white leading-tight tracking-tight drop-shadow-md">
                  {mix.subtitle}
                </div>
              </div>

              {/* Bottom Line / Wave graphic */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="h-1 w-10 bg-white/40 rounded-full" />
                
                {/* Floating Play Button */}
                <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shadow-xl opacity-90 sm:opacity-0 group-hover:opacity-100 group-hover:scale-105 active:scale-95 transition-all">
                  <Play className="w-4 h-4 fill-black ml-0.5" />
                </div>
              </div>
            </div>

            {/* Mix Text Details */}
            <div className="mt-2.5 space-y-0.5">
              <div className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-emerald-400 transition-colors">
                {mix.title}: {mix.subtitle}
              </div>
              <div className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                {mix.artists}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
