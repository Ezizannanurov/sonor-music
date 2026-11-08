'use client';

import React from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, 
  ListMusic 
} from 'lucide-react';
import PulseHeart from './PulseHeart';
import { Track } from '@/types/track';

interface AudioPlayerProps {
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
}

const SPEEDS = [0.8, 1.0, 1.2];

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  currentTrack,
  isPlaying,
  onPlayPause,
  onNext,
  onPrev,
  audioRef,
  currentTime,
  duration,
  onSeek,
  speed,
  onSpeedChange,
  isLiked,
  onToggleLike,
  onToggleQueue,
  isQueueOpen,
}) => {
  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-20 left-0 right-0 z-40 px-3.5 pb-1">
      <div className="max-w-2xl mx-auto bg-zinc-900/85 backdrop-blur-2xl border border-white/15 rounded-2xl p-2.5 px-3.5 flex items-center justify-between gap-3 relative shadow-[0_12px_36px_rgba(0,0,0,0.6)]">
        {/* Glass reflection top highlight */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

        {/* Track Info */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-white/10 flex-shrink-0 overflow-hidden shadow-inner">
            {currentTrack.thumbnail ? (
              <img
                src={currentTrack.thumbnail}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-zinc-800" />
            )}
          </div>
          <div className="truncate min-w-0 pr-1">
            <div className="text-xs sm:text-sm font-semibold text-white truncate">
              {currentTrack.title}
            </div>
            <div className="text-[11px] text-zinc-300 truncate mt-0.5">
              {currentTrack.artist}
            </div>
          </div>

          <div className="flex-shrink-0 flex items-center justify-center">
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

        {/* Playback Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            className="text-zinc-400 hover:text-white transition p-1 hidden sm:block"
          >
            <SkipBack className="w-4 h-4 fill-current" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPlayPause();
            }}
            className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-[0_2px_12px_rgba(255,255,255,0.25)]"
            style={{
              boxShadow: isPlaying
                ? '0 0 16px var(--accent-glow, rgba(255,255,255,0.3))'
                : '0 2px 10px rgba(0,0,0,0.3)',
            }}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-black" />
            ) : (
              <Play className="w-4 h-4 fill-black ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            className="text-zinc-400 hover:text-white transition p-1"
          >
            <SkipForward className="w-4 h-4 fill-current" />
          </button>
        </div>

        {/* Speed & Queue */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const nextIdx = (SPEEDS.indexOf(speed) + 1) % SPEEDS.length;
              onSpeedChange(SPEEDS[nextIdx]);
            }}
            className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-zinc-200 text-[11px] font-medium tabular-nums transition backdrop-blur-sm"
          >
            {speed}x
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleQueue();
            }}
            className={`p-1.5 rounded-lg border transition ${
              isQueueOpen
                ? 'text-white bg-white/15 border-white/20'
                : 'text-zinc-400 hover:text-white border-transparent'
            }`}
          >
            <ListMusic className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress timeline bar */}
      <div className="max-w-2xl mx-auto px-3 -mt-0.5">
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={(e) => onSeek(Number(e.target.value))}
          className="w-full h-1 bg-white/15 rounded-full appearance-none cursor-pointer"
          style={{ accentColor: 'var(--accent-color, #6366f1)' }}
        />
      </div>
    </div>
  );
};
