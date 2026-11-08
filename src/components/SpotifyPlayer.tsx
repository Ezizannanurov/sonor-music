'use client';

import React, { useState } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, 
  ListMusic, ChevronDown, Shuffle, Repeat, Repeat1, 
  Volume2, VolumeX, ListPlus, Maximize2, Sparkles, Share2
} from 'lucide-react';
import PulseHeart from './PulseHeart';
import { Track } from '@/types/track';
import ServiceLogo from './ServiceLogo';

interface SpotifyPlayerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  isLiked: boolean;
  onToggleLike: (track: Track) => void;
  onToggleQueue: () => void;
  isQueueOpen: boolean;
  onOpenAddToPlaylist?: (track: Track) => void;
  isShuffle: boolean;
  onToggleShuffle: () => void;
  repeatMode: 'off' | 'all' | 'one';
  onToggleRepeat: () => void;
  isExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}

const SPEEDS = [0.8, 1.0, 1.2];

export const SpotifyPlayer: React.FC<SpotifyPlayerProps> = ({
  currentTrack,
  isPlaying,
  onPlayPause,
  onNext,
  onPrev,
  audioRef: _audioRef,
  currentTime,
  duration,
  onSeek,
  volume,
  onVolumeChange,
  speed,
  onSpeedChange,
  isLiked,
  onToggleLike,
  onToggleQueue,
  isQueueOpen,
  onOpenAddToPlaylist,
  isShuffle,
  onToggleShuffle,
  repeatMode,
  onToggleRepeat,
  isExpanded: externalExpanded,
  onExpandedChange,
}) => {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const isExpanded = externalExpanded !== undefined ? externalExpanded : internalExpanded;
  const setIsExpanded = (val: boolean) => {
    setInternalExpanded(val);
    onExpandedChange?.(val);
  };

  const [prevVolume, setPrevVolume] = useState(volume || 0.8);

  if (!currentTrack) return null;

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleMuteToggle = () => {
    if (volume > 0) {
      setPrevVolume(volume);
      onVolumeChange(0);
    } else {
      onVolumeChange(prevVolume || 0.8);
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {/* 1. SPOTIFY MINI PLAYER (Docked above bottom navigation with safe-area support) */}
      {!isExpanded && (
        <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] left-0 right-0 z-40 px-2.5 sm:px-4 md:px-6">
        <div
          onClick={() => setIsExpanded(true)}
          className="max-w-2xl mx-auto bg-zinc-900/95 hover:bg-zinc-900/98 backdrop-blur-2xl border border-white/15 rounded-2xl p-2 sm:p-2.5 px-3 sm:px-3.5 flex items-center justify-between gap-2.5 sm:gap-3 relative shadow-[0_16px_40px_rgba(0,0,0,0.7)] cursor-pointer group transition-all duration-200 active:scale-[0.99]"
          style={{
            borderColor: isPlaying ? 'var(--accent-color, rgba(255,255,255,0.2))' : undefined,
            boxShadow: isPlaying ? '0 10px 30px var(--accent-glow, rgba(0,0,0,0.5))' : undefined,
          }}
        >
          {/* Subtle top gloss line */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

          {/* Track Info */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-zinc-800 border border-white/10 flex-shrink-0 overflow-hidden shadow-inner group-hover:scale-105 transition-transform">
              {currentTrack.thumbnail ? (
                <img
                  src={currentTrack.thumbnail}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-500">
                  🎵
                </div>
              )}
              {isPlaying && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <div className="flex items-end gap-0.5 h-3">
                    <span className="w-0.5 bg-white h-2 animate-bounce" />
                    <span className="w-0.5 bg-white h-3 animate-bounce [animation-delay:0.15s]" />
                    <span className="w-0.5 bg-white h-1.5 animate-bounce [animation-delay:0.3s]" />
                  </div>
                </div>
              )}
            </div>

            <div className="truncate min-w-0 pr-1">
              <div className="text-xs sm:text-sm font-bold text-white truncate flex items-center gap-1.5">
                <span>{currentTrack.title}</span>
                <ServiceLogo source={currentTrack.source} className="w-3 h-3 flex-shrink-0 opacity-70" />
              </div>
              <div className="text-[11px] text-zinc-400 truncate mt-0.5 font-medium">
                {currentTrack.artist}
              </div>
            </div>

            <div
              className="flex-shrink-0 flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <PulseHeart
                liked={isLiked}
                showCount={false}
                size={18}
                corner={20}
                pillColor="transparent"
                idleColor="#71717a"
                likedColor="#ff4d6d"
                onChange={() => onToggleLike(currentTrack)}
              />
            </div>
          </div>

          {/* Controls */}
          <div
            className="flex items-center gap-1 sm:gap-2 flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onPrev}
              className="text-zinc-400 hover:text-white transition p-2 hidden sm:block active:scale-95"
              title="Предыдущий трек"
            >
              <SkipBack className="w-4 h-4 fill-current" />
            </button>

            <button
              type="button"
              onClick={onPlayPause}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-lg"
              style={{
                boxShadow: isPlaying ? '0 0 16px var(--accent-glow, rgba(255,255,255,0.4))' : undefined,
              }}
              title={isPlaying ? 'Пауза' : 'Воспроизведение'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-black" />
              ) : (
                <Play className="w-4 h-4 fill-black ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={onNext}
              className="text-zinc-400 hover:text-white transition p-2 active:scale-95"
              title="Следующий трек"
            >
              <SkipForward className="w-4 h-4 fill-current" />
            </button>

            {/* Expand / Fullscreen icon */}
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              className="p-1.5 text-zinc-400 hover:text-white transition hidden md:block"
              title="Развернуть плеер Spotify"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Mini progress bar along bottom of card */}
          <div className="absolute bottom-0 left-3 right-3 h-[2px] bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-150"
              style={{
                width: `${progressPercent}%`,
                backgroundColor: 'var(--accent-color, #ffffff)',
                boxShadow: '0 0 6px var(--accent-glow, rgba(255,255,255,0.5))',
              }}
            />
          </div>
        </div>
      </div>
    )}

      {/* 2. SPOTIFY EXPANDED FULL-SCREEN PLAYER OVERLAY */}
      {isExpanded && (
        <div className="fixed inset-0 z-[100] bg-zinc-950/98 backdrop-blur-3xl flex flex-col justify-between p-4 sm:p-8 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] animate-fadeIn overflow-y-auto">
          {/* Mobile Top Dismiss Handle */}
          <div
            className="w-10 h-1 bg-white/25 rounded-full mx-auto mb-1 sm:hidden cursor-pointer"
            onClick={() => setIsExpanded(false)}
            title="Смахнуть вниз"
          />

          {/* Top subtle ambient glow matching theme */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-80 rounded-full blur-[120px] pointer-events-none opacity-30"
            style={{ backgroundColor: 'var(--accent-color, #6366f1)' }}
          />

          {/* Top Bar */}
          <div className="flex items-center justify-between relative z-10 w-full max-w-xl mx-auto pt-1">
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="p-2 sm:p-2.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition active:scale-95"
              title="Свернуть плеер"
            >
              <ChevronDown className="w-6 h-6" />
            </button>

            <div className="text-center">
              <span className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
                СЕЙЧАС ИГРАЕТ
              </span>
              <div className="text-xs text-white font-medium flex items-center justify-center gap-1.5 mt-0.5">
                <ServiceLogo source={currentTrack.source} className="w-3.5 h-3.5" />
                <span className="capitalize">{currentTrack.source}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onToggleQueue}
              className={`p-2 sm:p-2.5 rounded-full border transition active:scale-95 ${
                isQueueOpen
                  ? 'text-white bg-white/15 border-white/20'
                  : 'text-zinc-400 hover:text-white hover:bg-white/10 border-transparent'
              }`}
              title="Очередь треков"
            >
              <ListMusic className="w-5 h-5" />
            </button>
          </div>

          {/* Middle: Big Album Cover (Responsive for mobile portrait) */}
          <div className="flex-1 flex items-center justify-center my-3 sm:my-6 relative z-10 min-h-[160px]">
            <div className="relative w-52 h-52 sm:w-72 sm:h-72 md:w-80 md:h-80 max-h-[35vh] aspect-square rounded-2xl sm:rounded-3xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.9)] border border-white/15 group">
              {currentTrack.thumbnail ? (
                <img
                  src={currentTrack.thumbnail}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-5xl">
                  🎵
                </div>
              )}
              {/* Overlay reflection shine */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
            </div>
          </div>

          {/* Bottom Control Section */}
          <div className="w-full max-w-xl mx-auto space-y-4 sm:space-y-5 relative z-10 pb-2 sm:pb-4">
            {/* Title & Actions */}
            <div className="flex items-center justify-between gap-4">
              <div className="truncate flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate">
                  {currentTrack.title}
                </h2>
                <p className="text-sm sm:text-base text-zinc-400 font-medium truncate mt-0.5">
                  {currentTrack.artist}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {onOpenAddToPlaylist && (
                  <button
                    type="button"
                    onClick={() => onOpenAddToPlaylist(currentTrack)}
                    className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition active:scale-95"
                    title="Добавить в плейлист"
                  >
                    <ListPlus className="w-5 h-5" />
                  </button>
                )}

                <PulseHeart
                  liked={isLiked}
                  showCount={false}
                  size={24}
                  corner={24}
                  pillColor="transparent"
                  idleColor="#71717a"
                  likedColor="#ff4d6d"
                  onChange={() => onToggleLike(currentTrack)}
                />
              </div>
            </div>

            {/* Scrubber Progress Bar & Timestamps */}
            <div className="space-y-1.5">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={(e) => onSeek(Number(e.target.value))}
                className="w-full h-1.5 bg-white/15 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: 'var(--accent-color, #ffffff)' }}
              />
              <div className="flex justify-between text-xs text-zinc-400 font-medium tabular-nums">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Main Playback Bar (Shuffle, Prev, Huge Play, Next, Repeat) */}
            <div className="flex items-center justify-between px-2 sm:px-6">
              {/* Shuffle */}
              <button
                type="button"
                onClick={onToggleShuffle}
                className={`p-2 transition active:scale-95 ${
                  isShuffle ? 'text-[var(--accent-color,#10b981)]' : 'text-zinc-400 hover:text-white'
                }`}
                title="Перемешать треки"
              >
                <Shuffle className="w-5 h-5" />
              </button>

              {/* Prev */}
              <button
                type="button"
                onClick={onPrev}
                className="p-2 text-zinc-300 hover:text-white transition active:scale-90"
                title="Предыдущий трек"
              >
                <SkipBack className="w-7 h-7 fill-current" />
              </button>

              {/* Huge Play/Pause */}
              <button
                type="button"
                onClick={onPlayPause}
                className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-2xl"
                style={{
                  boxShadow: `0 0 25px var(--accent-glow, rgba(255,255,255,0.4))`,
                }}
                title={isPlaying ? 'Пауза' : 'Воспроизведение'}
              >
                {isPlaying ? (
                  <Pause className="w-7 h-7 fill-black" />
                ) : (
                  <Play className="w-7 h-7 fill-black ml-1" />
                )}
              </button>

              {/* Next */}
              <button
                type="button"
                onClick={onNext}
                className="p-2 text-zinc-300 hover:text-white transition active:scale-90"
                title="Следующий трек"
              >
                <SkipForward className="w-7 h-7 fill-current" />
              </button>

              {/* Repeat */}
              <button
                type="button"
                onClick={onToggleRepeat}
                className={`p-2 transition active:scale-95 ${
                  repeatMode !== 'off'
                    ? 'text-[var(--accent-color,#10b981)]'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title={`Режим повтора: ${repeatMode}`}
              >
                {repeatMode === 'one' ? (
                  <Repeat1 className="w-5 h-5" />
                ) : (
                  <Repeat className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Bottom Accessories: Speed & Volume */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
              <button
                type="button"
                onClick={() => {
                  const nextIdx = (SPEEDS.indexOf(speed) + 1) % SPEEDS.length;
                  onSpeedChange(SPEEDS[nextIdx]);
                }}
                className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-zinc-200 font-semibold tabular-nums transition"
              >
                {speed}x Скорость
              </button>

              {/* Volume Slider */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleMuteToggle}
                  className="text-zinc-400 hover:text-white transition"
                >
                  {volume === 0 ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={(e) => onVolumeChange(Number(e.target.value))}
                  className="w-20 sm:w-28 h-1 bg-white/20 rounded-full appearance-none cursor-pointer"
                  style={{ accentColor: 'var(--accent-color, #ffffff)' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
