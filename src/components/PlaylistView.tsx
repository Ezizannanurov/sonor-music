'use client';

import React from 'react';
import { ArrowLeft, Play, Shuffle, Trash2, Music, Clock } from 'lucide-react';
import { Playlist } from '@/types/playlist';
import { Track } from '@/types/track';
import { TrackCard } from './TrackCard';

interface PlaylistViewProps {
  playlist: Playlist;
  onBack: () => void;
  onPlayTrack: (track: Track) => void;
  onPlayAll: (tracks: Track[], shuffle?: boolean) => void;
  onRemoveTrack: (playlistId: string, trackId: string) => void;
  onDeletePlaylist: (playlistId: string) => void;
  currentTrack: Track | null;
  isPlaying: boolean;
  favorites: Track[];
  onToggleFavorite: (track: Track) => void;
  onAddToQueue: (track: Track) => void;
  onAddToPlaylist: (track: Track) => void;
  offlineTrackIds?: Set<string>;
  downloadingTrackIds?: Set<string>;
  onToggleOffline?: (track: Track) => void;
}

export const PlaylistView: React.FC<PlaylistViewProps> = ({
  playlist,
  onBack,
  onPlayTrack,
  onPlayAll,
  onRemoveTrack,
  onDeletePlaylist,
  currentTrack,
  isPlaying,
  favorites,
  onToggleFavorite,
  onAddToQueue,
  onAddToPlaylist,
  offlineTrackIds,
  downloadingTrackIds,
  onToggleOffline,
}) => {
  const totalDuration = playlist.tracks.reduce((acc, t) => acc + (t.duration || 0), 0);
  const totalMinutes = Math.floor(totalDuration / 60);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Back Button */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition group py-1"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        <span>Назад к медиатеке</span>
      </button>

      {/* Playlist Hero Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 p-6 rounded-3xl bg-zinc-900/60 border border-white/10 backdrop-blur-xl relative overflow-hidden">
        {/* Ambient background glow */}
        <div
          className="absolute -top-12 -left-12 w-64 h-64 rounded-full blur-[90px] opacity-35 pointer-events-none"
          style={{ backgroundColor: playlist.coverColor || '#6366f1' }}
        />

        {/* Big Playlist Artwork */}
        <div
          className="w-36 h-36 sm:w-44 sm:h-44 rounded-2xl flex items-center justify-center shadow-[0_15px_40px_rgba(0,0,0,0.7)] flex-shrink-0 relative z-10"
          style={{ backgroundColor: playlist.coverColor || '#6366f1' }}
        >
          <Music className="w-16 h-16 text-black/80 stroke-[2]" />
        </div>

        {/* Meta & Info */}
        <div className="flex-1 text-center sm:text-left relative z-10 min-w-0">
          <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
            ПЛЕЙЛИСТ
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight truncate mt-1">
            {playlist.title}
          </h1>
          {playlist.description && (
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 line-clamp-2">
              {playlist.description}
            </p>
          )}

          <div className="flex items-center justify-center sm:justify-start gap-3 mt-3 text-xs text-zinc-400">
            <span className="font-semibold text-white">{playlist.tracks.length} треков</span>
            {totalDuration > 0 && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>~{totalMinutes} мин</span>
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            disabled={playlist.tracks.length === 0}
            onClick={() => onPlayAll(playlist.tracks, false)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black font-bold text-xs hover:scale-105 active:scale-95 transition disabled:opacity-50 shadow-lg"
          >
            <Play className="w-4 h-4 fill-black" />
            <span>Слушать всё</span>
          </button>

          <button
            type="button"
            disabled={playlist.tracks.length === 0}
            onClick={() => onPlayAll(playlist.tracks, true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-white font-semibold text-xs transition disabled:opacity-50 active:scale-95"
            title="Перемешать и воспроизвести"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Перемешать</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            if (confirm(`Удалить плейлист "${playlist.title}"?`)) {
              onDeletePlaylist(playlist.id);
            }
          }}
          className="text-xs text-zinc-500 hover:text-red-400 p-2 rounded-xl hover:bg-red-500/10 transition flex items-center gap-1.5"
          title="Удалить плейлист"
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">Удалить плейлист</span>
        </button>
      </div>

      {/* Tracks List */}
      {playlist.tracks.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/40 rounded-3xl border border-white/5 p-6">
          <Music className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-white">В плейлисте пока нет треков</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            Нажимайте иконку «+» на любом треке на Главной или в Поиске, чтобы добавить его сюда.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {playlist.tracks.map((track, idx) => (
            <div key={`${track.id}-${idx}`} className="group relative">
              <TrackCard
                track={track}
                index={idx}
                isPlaying={isPlaying}
                isCurrent={currentTrack?.id === track.id}
                isLiked={favorites.some((f) => f.id === track.id)}
                isOffline={offlineTrackIds?.has(track.id)}
                isDownloading={downloadingTrackIds?.has(track.id)}
                onPlay={onPlayTrack}
                onToggleLike={onToggleFavorite}
                onToggleOffline={onToggleOffline}
                onAddToQueue={onAddToQueue}
                onAddToPlaylist={onAddToPlaylist}
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveTrack(playlist.id, track.id);
                }}
                className="absolute right-12 top-1/2 -translate-y-1/2 p-1.5 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition z-10"
                title="Удалить из плейлиста"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
