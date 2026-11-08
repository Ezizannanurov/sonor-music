import fs from 'fs';
import path from 'path';
import { User } from '@/types/user';
import { Playlist } from '@/types/playlist';
import { Track } from '@/types/track';

export interface DBUser extends User {
  passwordHash: string;
}

export interface DBFavorite {
  id: string;
  userId: string;
  track: Track;
  createdAt: number;
}

export interface DatabaseSchema {
  users: DBUser[];
  playlists: Playlist[];
  favorites: DBFavorite[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data folder and db.json exist
function ensureDb(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const initialData: DatabaseSchema = {
      users: [],
      playlists: [],
      favorites: [],
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }

  try {
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Error reading db.json, reinitializing:', err);
    const initialData: DatabaseSchema = {
      users: [],
      playlists: [],
      favorites: [],
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }
}

// Atomic save to avoid corruption
function saveDb(data: DatabaseSchema): void {
  ensureDb();
  const tmpFile = `${DB_FILE}.tmp.${Date.now()}`;
  fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmpFile, DB_FILE);
}

// --- USER OPERATIONS ---
export function getUserByEmail(email: string): DBUser | null {
  const db = ensureDb();
  return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
}

export function getUserByUsername(username: string): DBUser | null {
  const db = ensureDb();
  return db.users.find((u) => u.username.toLowerCase() === username.toLowerCase()) || null;
}

export function getUserById(id: string): DBUser | null {
  const db = ensureDb();
  return db.users.find((u) => u.id === id) || null;
}

export function createUser(user: DBUser): DBUser {
  const db = ensureDb();
  db.users.push(user);
  saveDb(db);
  return user;
}

// --- PLAYLIST OPERATIONS ---
export function getPlaylistsByUserId(userId: string): Playlist[] {
  const db = ensureDb();
  return db.playlists.filter((p) => p.userId === userId);
}

export function getPlaylistById(playlistId: string): Playlist | null {
  const db = ensureDb();
  return db.playlists.find((p) => p.id === playlistId) || null;
}

export function createPlaylist(playlist: Playlist): Playlist {
  const db = ensureDb();
  db.playlists.unshift(playlist);
  saveDb(db);
  return playlist;
}

export function updatePlaylist(playlistId: string, updates: Partial<Playlist>, userId: string): Playlist | null {
  const db = ensureDb();
  const index = db.playlists.findIndex((p) => p.id === playlistId && p.userId === userId);
  if (index === -1) return null;

  db.playlists[index] = {
    ...db.playlists[index],
    ...updates,
    updatedAt: Date.now(),
  };

  saveDb(db);
  return db.playlists[index];
}

export function deletePlaylist(playlistId: string, userId: string): boolean {
  const db = ensureDb();
  const prevLen = db.playlists.length;
  db.playlists = db.playlists.filter((p) => !(p.id === playlistId && p.userId === userId));
  if (db.playlists.length !== prevLen) {
    saveDb(db);
    return true;
  }
  return false;
}

// --- FAVORITES OPERATIONS ---
export function getFavoritesByUserId(userId: string): Track[] {
  const db = ensureDb();
  return db.favorites
    .filter((f) => f.userId === userId)
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((f) => f.track);
}

export function toggleFavorite(userId: string, track: Track): { isLiked: boolean; favorites: Track[] } {
  const db = ensureDb();
  const existingIdx = db.favorites.findIndex((f) => f.userId === userId && f.track.id === track.id);

  if (existingIdx !== -1) {
    db.favorites.splice(existingIdx, 1);
    saveDb(db);
    return { isLiked: false, favorites: getFavoritesByUserId(userId) };
  } else {
    db.favorites.push({
      id: `fav_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      track,
      createdAt: Date.now(),
    });
    saveDb(db);
    return { isLiked: true, favorites: getFavoritesByUserId(userId) };
  }
}
