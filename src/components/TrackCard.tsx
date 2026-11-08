'use client';

import { Play, Pause, Plus, ExternalLink, ListPlus, ArrowDownToLine, CheckCircle2, Loader2 } from 'lucide-react';
import PulseHeart from './PulseHeart';
import ServiceLogo from './ServiceLogo';
import { Track } from '@/types/track';

interface TrackCardProps {
  track: Track;
  isPlaying: boolean;
  isCurrent: boolean;
  isLiked?: boolean;
  isOffline?: boolean;
  isDownloading?: boolean;
  index: number;
  onPlay: (track: Track) => void;
  onToggleLike?: (track: Track) => void;
  onAddToQueue?: (track: Track) => void;
  onAddToPlaylist?: (track: Track) => void;
  onToggleOffline?: (track: Track) => void;
}

export const TrackCard: React.FC<TrackCardProps> = ({
  track,
  isPlaying,
  isCurrent,
  isLiked = false,
  isOffline = false,
  isDownloading = false,
  index,
  onPlay,
  onToggleLike,
  onAddToQueue,
  onAddToPlaylist,
  onToggleOffline,
}) => {
  const formatDuration = (secs: number) => {
    if (!secs || isNaN(secs)) return '--:--';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      onClick={() => onPlay(track)}
      className={`group flex items-center justify-between px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl transition-all duration-200 cursor-pointer select-none border active:scale-[0.99] active:bg-zinc-800/50 ${
        isCurrent
          ? 'border-white/20 shadow-md'
          : 'border-transparent hover:bg-zinc-900/60'
      }`}
      style={
        isCurrent
          ? {
              backgroundColor: 'var(--accent-subtle, rgba(99, 102, 241, 0.12))',
              borderColor: 'color-mix(in srgb, var(--accent-color, #6366f1) 35%, transparent)',
              boxShadow: '0 4px 20px var(--accent-glow, rgba(99, 102, 241, 0.15))',
            }
          : undefined
      }
    >
      {/* Left: Index / Play status + Cover + Meta */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1 pr-2 sm:pr-4">
        {/* Track Number / Play Icon */}
        <div className="w-4 sm:w-5 text-center flex-shrink-0 text-xs text-zinc-400 font-medium tabular-nums">
          <span
            className="group-hover:hidden"
            style={isCurrent && isPlaying ? { color: 'var(--accent-color, #ffffff)' } : undefined}
          >
            {isCurrent && isPlaying ? '▶' : index + 1}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlay(track);
            }}
            className="hidden group-hover:inline-block text-white hover:scale-110 transition"
          >
            {isCurrent && isPlaying ? (
              <Pause className="w-4 h-4 fill-white" />
            ) : (
              <Play className="w-4 h-4 fill-white" />
            )}
          </button>
        </div>

        {/* Thumbnail */}
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-zinc-800 flex-shrink-0 overflow-hidden relative">
          {track.thumbnail ? (
            <img src={track.thumbnail} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-zinc-800" />
          )}
        </div>

        {/* Title & Artist */}
        <div className="truncate flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`text-sm truncate leading-snug tracking-normal ${
                isCurrent ? 'text-white font-semibold' : 'text-zinc-200 font-medium group-hover:text-white'
              }`}
            >
              {track.title}
            </span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-zinc-400 truncate mt-0.5">
            <span className="truncate">{track.artist}</span>
            <span className="text-zinc-600 font-light">•</span>
            <span
              className="inline-flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
              title={
                track.source === 'spotify'
                  ? 'Spotify'
                  : track.source === 'soundcloud'
                  ? 'SoundCloud'
                  : 'YouTube Music'
              }
            >
              <ServiceLogo source={track.source} className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </span>
          </div>
        </div>
      </div>

      {/* Right: Actions & Duration */}
      <div
        className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        {onToggleOffline && (
          <button
            type="button"
            onClick={() => onToggleOffline(track)}
            className={`p-1.5 transition active:scale-90 ${
              isOffline
                ? 'text-emerald-400 opacity-90'
                : 'text-zinc-500 hover:text-white opacity-70 sm:opacity-0 sm:group-hover:opacity-100'
            }`}
            title={
              isDownloading
                ? 'Скачивание на устройство...'
                : isOffline
                ? 'Сохранено офлайн (нажмите для удаления)'
                : 'Скачать на телефон для офлайн'
            }
          >
            {isDownloading ? (
              <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin text-zinc-300" />
            ) : isOffline ? (
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
            ) : (
              <ArrowDownToLine className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            )}
          </button>
        )}

        {onAddToPlaylist && (
          <button
            onClick={() => onAddToPlaylist(track)}
            className="p-1.5 text-zinc-400 hover:text-white transition opacity-70 sm:opacity-0 sm:group-hover:opacity-100 active:scale-90"
            title="Добавить в плейлист"
          >
            <ListPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        )}

        {onAddToQueue && (
          <button
            onClick={() => onAddToQueue(track)}
            className="p-1.5 text-zinc-400 hover:text-white transition opacity-70 sm:opacity-0 sm:group-hover:opacity-100 active:scale-90"
            title="В очередь"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        )}

        {onToggleLike && (
          <div title="В избранное" className="flex items-center justify-center">
            <PulseHeart
              liked={isLiked}
              showCount={false}
              size={17}
              corner={20}
              pillColor="transparent"
              idleColor="#71717a"
              likedColor="#ff4d6d"
              onChange={() => onToggleLike(track)}
            />
          </div>
        )}

        {track.externalUrl && (
          <a
            href={track.externalUrl}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 text-zinc-500 hover:text-white transition opacity-0 group-hover:opacity-100"
            title="Оригинал"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}

        <span className="text-xs text-zinc-400 font-medium tabular-nums w-10 text-right">
          {formatDuration(track.duration)}
        </span>
      </div>
    </div>
  );
};
