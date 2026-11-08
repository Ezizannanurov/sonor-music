'use client';

import React from 'react';
import { Play, Pause, Clock, Trash2 } from 'lucide-react';
import { Track } from '@/types/track';
import ServiceLogo from './ServiceLogo';

interface HomeRecentlyPlayedProps {
  recentTracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayTrack: (track: Track) => void;
  onClearRecent?: () => void;
}

export const HomeRecentlyPlayed: React.FC<HomeRecentlyPlayedProps> = ({
  recentTracks,
  currentTrack,
  isPlaying,
  onPlayTrack,
  onClearRecent,
}) => {
  if (!recentTracks || recentTracks.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-zinc-400" />
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
            Недавно прослушано
          </h2>
        </div>
        {onClearRecent && recentTracks.length > 0 && (
          <button
            type="button"
            onClick={onClearRecent}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition flex items-center gap-1 active:scale-95"
            title="Очистить историю"
          >
            <Trash2 className="w-3 h-3" />
            <span className="hidden sm:inline">Очистить</span>
          </button>
        )}
      </div>

      {/* Spotify-style Quick Resume Grid (2 cols on mobile, 3 on desktop) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
        {recentTracks.slice(0, 6).map((track) => {
          const isThisTrack = currentTrack?.id === track.id;
          const isThisPlaying = isThisTrack && isPlaying;

          return (
            <div
              key={`recent-${track.id}`}
              onClick={() => onPlayTrack(track)}
              className={`group relative flex items-center rounded-xl overflow-hidden bg-zinc-900/60 hover:bg-zinc-800/80 border transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                isThisTrack
                  ? 'border-white/30 bg-zinc-800/70 shadow-md'
                  : 'border-white/5 hover:border-white/15'
              }`}
              style={
                isThisTrack
                  ? {
                      borderColor: 'var(--accent-color, rgba(255,255,255,0.3))',
                      boxShadow: '0 4px 20px var(--accent-glow, rgba(0,0,0,0.4))',
                    }
                  : undefined
              }
            >
              {/* Cover Art */}
              <div className="relative w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 bg-zinc-800 overflow-hidden">
                {track.thumbnail ? (
                  <img
                    src={track.thumbnail}
                    alt={track.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600 text-lg">
                    🎵
                  </div>
                )}
                {isThisPlaying && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="flex items-end gap-0.5 h-3">
                      <span className="w-0.5 bg-white h-2 animate-bounce" />
                      <span className="w-0.5 bg-white h-3 animate-bounce [animation-delay:0.15s]" />
                      <span className="w-0.5 bg-white h-1.5 animate-bounce [animation-delay:0.3s]" />
                    </div>
                  </div>
                )}
              </div>

              {/* Title & Artist */}
              <div className="flex-1 min-w-0 px-2.5 py-1.5">
                <div className="text-xs sm:text-sm font-semibold text-white truncate leading-snug">
                  {track.title}
                </div>
                <div className="text-[11px] text-zinc-400 truncate mt-0.5 flex items-center gap-1">
                  <span className="truncate">{track.artist}</span>
                  <ServiceLogo source={track.source} className="w-2.5 h-2.5 flex-shrink-0 opacity-60" />
                </div>
              </div>

              {/* Hover / Tap Play Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onPlayTrack(track);
                }}
                className={`mr-2.5 w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shadow-lg transition-all duration-200 active:scale-90 flex-shrink-0 ${
                  isThisTrack
                    ? 'opacity-100 scale-100'
                    : 'opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 sm:block hidden'
                }`}
                style={{
                  boxShadow: isThisPlaying ? '0 0 12px var(--accent-glow, rgba(255,255,255,0.4))' : undefined,
                }}
                title={isThisPlaying ? 'Пауза' : 'Слушать'}
              >
                {isThisPlaying ? (
                  <Pause className="w-3.5 h-3.5 fill-black" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
};
