import { Track } from '@/types/track';

const DB_NAME = 'sonor_music_offline';
const DB_VERSION = 2; // Incremented for arrayBuffer migration
const STORE_NAME = 'tracks';

export interface StoredOfflineRecord {
  id: string;
  track: Track;
  audioBuffer?: ArrayBuffer;
  audioBlob?: Blob; // Legacy fallback
  mimeType?: string;
  thumbnailDataUrl?: string;
  size: number;
  downloadedAt: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;
const activeObjectUrls = new Map<string, string>();

function getDB(): Promise<IDBDatabase> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('IndexedDB is not available on server'));
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  return dbPromise;
}

/**
 * Checks whether a track is already cached in offline storage.
 */
export async function isTrackOffline(trackId: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(String(trackId));
      req.onsuccess = () => resolve(Boolean(req.result));
      req.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

/**
 * Fetches all cached offline tracks list.
 */
export async function getAllOfflineTracks(): Promise<Track[]> {
  if (typeof window === 'undefined') return [];
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const records = (req.result || []) as StoredOfflineRecord[];
        // Sort newest cached first
        records.sort((a, b) => (b.downloadedAt || 0) - (a.downloadedAt || 0));
        const tracks = records.map((r) => {
          const track = { ...r.track };
          if (r.thumbnailDataUrl) {
            track.thumbnail = r.thumbnailDataUrl;
          }
          return track;
        });
        resolve(tracks);
      };
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

/**
 * Gets a blob URL for offline audio playback.
 */
export async function getOfflineAudioUrl(trackId: string): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  if (activeObjectUrls.has(trackId)) {
    return activeObjectUrls.get(trackId)!;
  }

  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(String(trackId));
      req.onsuccess = () => {
        const record = req.result as StoredOfflineRecord | undefined;
        if (record) {
          let blob: Blob | null = null;
          if (record.audioBuffer) {
            blob = new Blob([record.audioBuffer], { type: record.mimeType || 'audio/mpeg' });
          } else if (record.audioBlob) {
            blob = record.audioBlob;
          }

          if (blob && blob.size > 1000) {
            const url = URL.createObjectURL(blob);
            activeObjectUrls.set(trackId, url);
            resolve(url);
            return;
          }
        }
        resolve(null);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Caches a track and cover thumbnail inside app IndexedDB for offline listening.
 */
export async function saveTrackOffline(
  track: Track,
  onProgress?: (percent: number) => void
): Promise<void> {
  if (typeof window === 'undefined') return;

  const fallbackStreamUrl = `/api/stream?title=${encodeURIComponent(track.title)}&artist=${encodeURIComponent(track.artist)}`;
  let streamUrl = track.streamUrl || fallbackStreamUrl;

  if (streamUrl.includes('apple.com') || track.source === 'spotify') {
    streamUrl = fallbackStreamUrl;
  }

  // Ensure absolute URL if running inside Capacitor local origin
  if (!streamUrl.startsWith('http://') && !streamUrl.startsWith('https://')) {
    const origin = typeof window !== 'undefined' && window.location ? window.location.origin : '';
    if (origin.includes('localhost') || !origin) {
      streamUrl = `https://sonor-music-ubvp.onrender.com${streamUrl.startsWith('/') ? streamUrl : '/' + streamUrl}`;
    }
  }

  onProgress?.(15);
  let audioRes = await fetch(streamUrl).catch(() => null);

  // If primary stream URL fails or returns non-200, retry with universal fallback URL
  if ((!audioRes || !audioRes.ok) && !streamUrl.includes('/api/stream?')) {
    onProgress?.(30);
    const absFallback = `https://sonor-music-ubvp.onrender.com${fallbackStreamUrl}`;
    audioRes = await fetch(absFallback).catch(() => null);
  }

  if (!audioRes || !audioRes.ok) {
    throw new Error(`Не удалось загрузить аудио: HTTP ${audioRes?.status || 'ошибка сети'}`);
  }

  onProgress?.(50);
  const audioBuffer = await audioRes.arrayBuffer();
  if (!audioBuffer || audioBuffer.byteLength < 10000) {
    throw new Error('Полученный аудиопоток пуст или недоступен для кеширования');
  }

  onProgress?.(75);
  const mimeType = audioRes.headers.get('content-type') || 'audio/mpeg';

  // Fetch cover thumbnail to base64 data url for full offline display
  let thumbnailDataUrl: string | undefined;
  if (track.thumbnail && !track.thumbnail.startsWith('data:')) {
    try {
      const thumbRes = await fetch(track.thumbnail);
      if (thumbRes.ok) {
        const thumbBlob = await thumbRes.blob();
        thumbnailDataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => resolve(track.thumbnail);
          reader.readAsDataURL(thumbBlob);
        });
      }
    } catch {
      thumbnailDataUrl = track.thumbnail;
    }
  }

  onProgress?.(90);
  const db = await getDB();
  const record: StoredOfflineRecord = {
    id: String(track.id),
    track: {
      ...track,
      thumbnail: thumbnailDataUrl || track.thumbnail,
    },
    audioBuffer,
    mimeType,
    thumbnailDataUrl,
    size: audioBuffer.byteLength,
    downloadedAt: Date.now(),
  };

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
    const store = tx.objectStore(STORE_NAME);
    store.put(record);
  });

  onProgress?.(100);
}

/**
 * Removes a track from in-app cache.
 */
export async function deleteOfflineTrack(trackId: string): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    if (activeObjectUrls.has(trackId)) {
      try {
        URL.revokeObjectURL(activeObjectUrls.get(trackId)!);
      } catch {}
      activeObjectUrls.delete(trackId);
    }

    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      const store = tx.objectStore(STORE_NAME);
      store.delete(String(trackId));
    });
  } catch {}
}

/**
 * Clears all cached tracks.
 */
export async function clearAllOfflineTracks(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    for (const url of activeObjectUrls.values()) {
      try {
        URL.revokeObjectURL(url);
      } catch {}
    }
    activeObjectUrls.clear();

    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      const store = tx.objectStore(STORE_NAME);
      store.clear();
    });
  } catch {}
}
