'use client';

import React from 'react';
import { X, Check, Plus, ListMusic, Music } from 'lucide-react';
import { usePlaylist } from '@/context/PlaylistContext';

export const AddToPlaylistModal: React.FC = () => {
  const {
    trackToAddToPlaylist,
    setTrackToAddToPlaylist,
    playlists,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    isTrackInPlaylist,
    setIsCreateModalOpen,
  } = usePlaylist();

  if (!trackToAddToPlaylist) return null;

  const handleToggle = (playlistId: string) => {
    if (isTrackInPlaylist(playlistId, trackToAddToPlaylist.id)) {
      removeTrackFromPlaylist(playlistId, trackToAddToPlaylist.id);
    } else {
      addTrackToPlaylist(playlistId, trackToAddToPlaylist);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={() => setTrackToAddToPlaylist(null)}
    >
      <div
        className="w-full max-w-md bg-zinc-950/95 backdrop-blur-2xl border border-white/15 rounded-3xl p-6 shadow-[0_25px_70px_rgba(0,0,0,0.85)] flex flex-col gap-4 text-zinc-100 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Добавить в плейлист
            </h3>
            <p className="text-xs text-zinc-400 truncate max-w-xs mt-0.5">
              {trackToAddToPlaylist.title} — {trackToAddToPlaylist.artist}
            </p>
          </div>

          <button
            onClick={() => setTrackToAddToPlaylist(null)}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* New Playlist Trigger */}
        <button
          type="button"
          onClick={() => {
            setIsCreateModalOpen(true);
          }}
          className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition text-left group"
        >
          <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center font-bold flex-shrink-0 group-hover:scale-105 transition-transform">
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="text-xs font-semibold text-white">Создать новый плейлист</div>
            <div className="text-[11px] text-zinc-400">Собрать персональную подборку</div>
          </div>
        </button>

        {/* Playlists List */}
        <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 scrollbar-none">
          {playlists.length === 0 ? (
            <div className="text-center py-6 text-xs text-zinc-500">
              У вас пока нет плейлистов
            </div>
          ) : (
            playlists.map((pl) => {
              const inPlaylist = isTrackInPlaylist(pl.id, trackToAddToPlaylist.id);
              return (
                <button
                  key={pl.id}
                  type="button"
                  onClick={() => handleToggle(pl.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-2xl border transition-all text-left ${
                    inPlaylist
                      ? 'bg-white/10 border-white/25 shadow-sm'
                      : 'bg-zinc-900/60 hover:bg-white/5 border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                      style={{
                        backgroundColor: pl.coverColor || '#6366f1',
                      }}
                    >
                      <Music className="w-5 h-5 text-black stroke-[2.5]" />
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-semibold text-white truncate">
                        {pl.title}
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        {pl.tracks.length} треков
                      </div>
                    </div>
                  </div>

                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition ${
                      inPlaylist
                        ? 'bg-white text-black'
                        : 'border border-zinc-600 text-transparent hover:border-zinc-400'
                    }`}
                  >
                    {inPlaylist && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Done Button */}
        <button
          type="button"
          onClick={() => setTrackToAddToPlaylist(null)}
          className="w-full py-2 bg-white text-black font-semibold text-xs rounded-xl hover:bg-zinc-200 transition"
        >
          Готово
        </button>
      </div>
    </div>
  );
};
