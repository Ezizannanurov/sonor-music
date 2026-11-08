import { Track } from '@/types/track';

const DB_NAME = 'sonor_music_offline';
const DB_VERSION = 1;
const STORE_NAME = 'tracks';

export interface StoredOfflineRecord {
  id: string;
  track: Track;
  audioBlob: Blob;
  thumbnailBlob?: Blob;
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
      const req = store.get(trackId);
      req.onsuccess = () => resolve(Boolean(req.result));
      req.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

/**
 * Fetches all downloaded offline tracks list.
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
        // Sort newest downloaded first
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
      const req = store.get(trackId);
      req.onsuccess = () => {
        const record = req.result as StoredOfflineRecord | undefined;
        if (record && record.audioBlob) {
          const url = URL.createObjectURL(record.audioBlob);
          activeObjectUrls.set(trackId, url);
          resolve(url);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Downloads and caches a track + cover thumbnail for offline listening.
 */
export async function saveTrackOffline(
  track: Track,
  onProgress?: (percent: number) => void
): Promise<void> {
  if (typeof window === 'undefined') return;

  const streamUrl =
    track.streamUrl ||
    `/api/stream?title=${encodeURIComponent(track.title)}&artist=${encodeURIComponent(track.artist)}`;

  // 1. Fetch audio stream as Blob
  onProgress?.(15);
  const audioRes = await fetch(streamUrl);
  if (!audioRes.ok) {
    throw new Error(`Не удалось загрузить аудио: HTTP ${audioRes.status}`);
  }

  onProgress?.(45);
  const audioBlob = await audioRes.blob();
  onProgress?.(75);

  // 2. Fetch cover thumbnail to base64 data url for full offline display
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
      // Keep remote thumbnail url if CORS prevents reading
      thumbnailDataUrl = track.thumbnail;
    }
  }

  onProgress?.(90);

  // 3. Store record into IndexedDB
  const db = await getDB();
  const record: StoredOfflineRecord = {
    id: track.id,
    track: {
      ...track,
      thumbnail: thumbnailDataUrl || track.thumbnail,
    },
    audioBlob,
    thumbnailDataUrl,
    size: audioBlob.size,
    downloadedAt: Date.now(),
  };

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(record);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });

  onProgress?.(100);
}

/**
 * Removes a track from offline cache.
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
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(trackId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Delete offline track error:', err);
  }
}

/**
 * Clears all cached tracks.
 */
export async function clearAllOfflineTracks(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    for (const [, url] of activeObjectUrls.entries()) {
      try {
        URL.revokeObjectURL(url);
      } catch {}
    }
    activeObjectUrls.clear();

    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Clear offline tracks error:', err);
  }
}

/**
 * Exports/saves the track directly as an MP3 file to the user's Downloads folder.
 */
export async function exportTrackFile(track: Track): Promise<void> {
  let blob: Blob | null = null;

  // Try from offline cache first
  try {
    const db = await getDB();
    const record = await new Promise<StoredOfflineRecord | undefined>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(track.id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(undefined);
    });
    if (record?.audioBlob) {
      blob = record.audioBlob;
    }
  } catch {}

  // If not in cache, fetch it
  if (!blob) {
    const streamUrl =
      track.streamUrl ||
      `/api/stream?title=${encodeURIComponent(track.title)}&artist=${encodeURIComponent(track.artist)}`;
    const res = await fetch(streamUrl);
    if (!res.ok) throw new Error('Не удалось получить аудиофайл');
    blob = await res.blob();
  }

  const url = URL.createObjectURL(blob);
  const safeFilename = `${track.artist} - ${track.title}`
    .replace(/[/\\?%*:|"<>]/g, '_')
    .slice(0, 100);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeFilename}.mp3`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}
