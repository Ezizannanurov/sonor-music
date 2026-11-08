'use client';

import React, { useState } from 'react';
import { X, ListPlus, Check } from 'lucide-react';
import { usePlaylist } from '@/context/PlaylistContext';

const PALETTE = [
  '#6366f1',
  '#10b981',
  '#ef4444',
  '#06b6d4',
  '#f97316',
  '#ec4899',
  '#eab308',
  '#a855f7',
];

export const CreatePlaylistModal: React.FC = () => {
  const { isCreateModalOpen, setIsCreateModalOpen, createPlaylist } = usePlaylist();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(PALETTE[0]);

  if (!isCreateModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createPlaylist(title, description, selectedColor);
    setTitle('');
    setDescription('');
    setIsCreateModalOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={() => setIsCreateModalOpen(false)}
    >
      <div
        className="w-full max-w-md bg-zinc-950/95 backdrop-blur-2xl border border-white/15 rounded-3xl p-6 shadow-[0_25px_70px_rgba(0,0,0,0.85)] flex flex-col gap-5 text-zinc-100 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg transition-all"
              style={{
                backgroundColor: selectedColor,
                boxShadow: `0 0 16px ${selectedColor}60`,
              }}
            >
              <ListPlus className="w-5 h-5 text-black stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Новый плейлист
              </h3>
              <p className="text-xs text-zinc-400">
                Создайте коллекцию для любимых треков
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(false)}
            className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-zinc-400 block mb-1 font-medium">
              Название плейлиста *
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Мой супер-микс"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-900/90 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/25 transition"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400 block mb-1 font-medium">
              Описание (необязательно)
            </label>
            <textarea
              rows={2}
              placeholder="Треки для ночной поездки, тренировок или отдыха..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-zinc-900/90 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/25 transition resize-none"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400 block mb-2 font-medium">
              Цветовая обложка
            </label>
            <div className="flex items-center gap-2.5 flex-wrap">
              {PALETTE.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-transform ${
                    selectedColor === color
                      ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-black'
                      : 'opacity-70 hover:opacity-100 hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                >
                  {selectedColor === color && (
                    <Check className="w-4 h-4 text-black stroke-[3]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={!title.trim()}
            className="w-full py-2.5 mt-2 bg-white text-black font-semibold text-sm rounded-xl hover:bg-zinc-200 transition disabled:opacity-50 active:scale-95 shadow-lg"
          >
            Создать плейлист
          </button>
        </form>
      </div>
    </div>
  );
};
