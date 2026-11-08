'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Playlist } from '@/types/playlist';
import { Track } from '@/types/track';
import { useAuth } from './AuthContext';

interface PlaylistContextType {
  playlists: Playlist[];
  createPlaylist: (title: string, description?: string, color?: string) => Promise<Playlist>;
  deletePlaylist: (playlistId: string) => Promise<void>;
  addTrackToPlaylist: (playlistId: string, track: Track) => Promise<void>;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  isTrackInPlaylist: (playlistId: string, trackId: string) => boolean;

  trackToAddToPlaylist: Track | null;
  setTrackToAddToPlaylist: (t: Track | null) => void;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;

  activePlaylist: Playlist | null;
  setActivePlaylist: (p: Playlist | null) => void;
}

const PlaylistContext = createContext<PlaylistContextType | undefined>(undefined);

const DEFAULT_PLAYLIST_COLORS = [
  '#6366f1',
  '#10b981',
  '#f97316',
  '#ec4899',
  '#06b6d4',
  '#eab308',
];

export const PlaylistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [trackToAddToPlaylist, setTrackToAddToPlaylist] = useState<Track | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activePlaylist, setActivePlaylist] = useState<Playlist | null>(null);

  // Load playlists from server if logged in, else localStorage
  useEffect(() => {
    const fetchPlaylists = async () => {
      if (user) {
        try {
          const res = await fetch('/api/playlists');
          if (res.ok) {
            const data = await res.json();
            setPlaylists(data.playlists || []);
            return;
          }
        } catch (e) {
          console.error('Failed to fetch server playlists:', e);
        }
      }

      // Guest fallback
      try {
        const stored = localStorage.getItem('pulse_playlists_guest');
        if (stored) {
          setPlaylists(JSON.parse(stored));
        } else {
          const starter: Playlist = {
            id: `pl_starter_${Date.now()}`,
            title: '🔥 Мой первый микс',
            description: 'Любимые треки и новинки',
            coverColor: DEFAULT_PLAYLIST_COLORS[0],
            tracks: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          setPlaylists([starter]);
          localStorage.setItem('pulse_playlists_guest', JSON.stringify([starter]));
        }
      } catch {
        setPlaylists([]);
      }
    };

    fetchPlaylists();
  }, [user?.id]);

  const createPlaylist = async (title: string, description?: string, color?: string): Promise<Playlist> => {
    const newColor = color || DEFAULT_PLAYLIST_COLORS[Math.floor(Math.random() * DEFAULT_PLAYLIST_COLORS.length)];

    if (user) {
      try {
        const res = await fetch('/api/playlists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, description, coverColor: newColor }),
        });
        if (res.ok) {
          const data = await res.json();
          const pl = data.playlist;
          setPlaylists((prev) => [pl, ...prev]);
          return pl;
        }
      } catch (err) {
        console.error('Failed to create server playlist:', err);
      }
    }

    // Guest fallback
    const newPl: Playlist = {
      id: `pl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim() || 'Новый плейлист',
      description: description?.trim(),
      coverColor: newColor,
      tracks: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      userId: user?.id,
    };
    const updated = [newPl, ...playlists];
    setPlaylists(updated);
    localStorage.setItem('pulse_playlists_guest', JSON.stringify(updated));
    return newPl;
  };

  const deletePlaylist = async (playlistId: string) => {
    if (user) {
      try {
        await fetch(`/api/playlists/${playlistId}`, { method: 'DELETE' });
      } catch (e) {
        console.error(e);
      }
    }

    const updated = playlists.filter((p) => p.id !== playlistId);
    setPlaylists(updated);
    if (!user) {
      localStorage.setItem('pulse_playlists_guest', JSON.stringify(updated));
    }
    if (activePlaylist?.id === playlistId) {
      setActivePlaylist(null);
    }
  };

  const addTrackToPlaylist = async (playlistId: string, track: Track) => {
    const pl = playlists.find((p) => p.id === playlistId);
    if (!pl) return;
    if (pl.tracks.some((t) => t.id === track.id)) return;

    const newTracks = [track, ...pl.tracks];

    if (user) {
      try {
        await fetch(`/api/playlists/${playlistId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tracks: newTracks }),
        });
      } catch (e) {
        console.error(e);
      }
    }

    const updated = playlists.map((p) =>
      p.id === playlistId ? { ...p, tracks: newTracks, updatedAt: Date.now() } : p
    );
    setPlaylists(updated);

    if (!user) {
      localStorage.setItem('pulse_playlists_guest', JSON.stringify(updated));
    }

    if (activePlaylist?.id === playlistId) {
      const activeUpdated = updated.find((p) => p.id === playlistId);
      if (activeUpdated) setActivePlaylist(activeUpdated);
    }
  };

  const removeTrackFromPlaylist = async (playlistId: string, trackId: string) => {
    const pl = playlists.find((p) => p.id === playlistId);
    if (!pl) return;

    const newTracks = pl.tracks.filter((t) => t.id !== trackId);

    if (user) {
      try {
        await fetch(`/api/playlists/${playlistId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tracks: newTracks }),
        });
      } catch (e) {
        console.error(e);
      }
    }

    const updated = playlists.map((p) =>
      p.id === playlistId ? { ...p, tracks: newTracks, updatedAt: Date.now() } : p
    );
    setPlaylists(updated);

    if (!user) {
      localStorage.setItem('pulse_playlists_guest', JSON.stringify(updated));
    }

    if (activePlaylist?.id === playlistId) {
      const activeUpdated = updated.find((p) => p.id === playlistId);
      if (activeUpdated) setActivePlaylist(activeUpdated);
    }
  };

  const isTrackInPlaylist = (playlistId: string, trackId: string): boolean => {
    const p = playlists.find((pl) => pl.id === playlistId);
    return p ? p.tracks.some((t) => t.id === trackId) : false;
  };

  return (
    <PlaylistContext.Provider
      value={{
        playlists,
        createPlaylist,
        deletePlaylist,
        addTrackToPlaylist,
        removeTrackFromPlaylist,
        isTrackInPlaylist,
        trackToAddToPlaylist,
        setTrackToAddToPlaylist,
        isCreateModalOpen,
        setIsCreateModalOpen,
        activePlaylist,
        setActivePlaylist,
      }}
    >
      {children}
    </PlaylistContext.Provider>
  );
};

export const usePlaylist = () => {
  const context = useContext(PlaylistContext);
  if (!context) {
    throw new Error('usePlaylist must be used within a PlaylistProvider');
  }
  return context;
};
