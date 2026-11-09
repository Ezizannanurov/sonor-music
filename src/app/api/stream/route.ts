import { NextResponse } from 'next/server';
import scdl from 'soundcloud-scraper';
import { Readable } from 'stream';
import axios from 'axios';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const Util = require('soundcloud-scraper/src/util/Util');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Store = require('soundcloud-scraper/src/store/Store');

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const client = new scdl.Client();

// In-memory cache for resolved track URLs to make seeks and repeats instant
interface CachedTrack {
  audioUrl: string;
  resolvedAt: number;
}
const cache = new Map<string, CachedTrack>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 60 minutes

const SILENT_MP3 = Buffer.from([
  0xff, 0xfb, 0x90, 0x64, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
]);

async function resolveSoundCloudStream(url: string): Promise<string | null> {
  try {
    const info = await client.getSongInfo(url).catch(() => null);
    if (!info) return null;
    const target = info.streams?.progressive || info.streams?.hls;
    if (target) {
      const apiKey = Store.get('SOUNDCLOUD_API_KEY');
      const streamUrl = await Util.fetchSongStreamURL(target, apiKey).catch(() => null);
      if (streamUrl && typeof streamUrl === 'string' && streamUrl.startsWith('http')) {
        return streamUrl;
      }
    }
  } catch (err) {
    console.warn('SoundCloud resolve error:', err);
  }
  return null;
}

async function searchSoundCloudStream(title: string, artist: string, query: string): Promise<string | null> {
  const cleanTitle = (title || '')
    .replace(/[\(\[\{].*?[\)\]\}]/g, '')
    .replace(/\b(official|audio|video|lyrics|hd|hq|remastered)\b/gi, '')
    .trim()
    .toLowerCase();
  const cleanArtist = (artist || '').split(/[&,xX/]/)[0].trim().toLowerCase();
  const searchTerms: string[] = [];
  if (cleanArtist && cleanTitle) searchTerms.push(`${cleanArtist} ${cleanTitle}`);
  if (query && !searchTerms.includes(query)) searchTerms.push(query);
  if (!cleanArtist && cleanTitle && !searchTerms.includes(cleanTitle)) searchTerms.push(cleanTitle);

  for (const term of searchTerms) {
    try {
      const results = await client.search(term, 'track').catch(() => []);
      if (!Array.isArray(results) || results.length === 0) continue;

      const artistTokens = cleanArtist ? cleanArtist.split(/\s+/).filter((w) => w.length > 2) : [];
      const titleTokens = cleanTitle ? cleanTitle.split(/\s+/).filter((w) => w.length > 2) : [];

      for (const item of results.slice(0, 3)) {
        if (!item.url) continue;
        const itemName = (item.name || '').toLowerCase();
        const itemArtist = (item.artist || '').toLowerCase();

        const matchTitle = titleTokens.length === 0 || titleTokens.some((t) => itemName.includes(t));
        const matchArtist = artistTokens.length === 0 || artistTokens.some((t) => itemArtist.includes(t) || itemName.includes(t));

        if (matchTitle && matchArtist) {
          const directStream = await resolveSoundCloudStream(item.url);
          if (directStream) return directStream;
        }
      }
    } catch {
      continue;
    }
  }
  return null;
}

async function searchDeezerStream(title: string, artist: string, query: string): Promise<string | null> {
  const cleanTitle = (title || '').replace(/[\(\[\{].*?[\)\]\}]/g, '').trim();
  const cleanArtist = (artist || '').split(/[&,xX/]/)[0].trim();
  const q = `${cleanArtist} ${cleanTitle}`.trim() || query;
  if (!q) return null;

  try {
    const res = await axios.get(`https://api.deezer.com/search?q=${encodeURIComponent(q)}`, { timeout: 3500 });
    const items = res.data?.data;
    if (Array.isArray(items) && items.length > 0) {
      for (const item of items.slice(0, 3)) {
        if (item.preview && item.preview.startsWith('http')) {
          return item.preview;
        }
      }
    }
  } catch (err) {
    console.warn('Deezer search error:', err);
  }
  return null;
}

async function searchItunesStream(title: string, artist: string, query: string): Promise<string | null> {
  const cleanTitle = (title || '').replace(/[\(\[\{].*?[\)\]\}]/g, '').trim();
  const cleanArtist = (artist || '').split(/[&,xX/]/)[0].trim();
  const q = `${cleanArtist} ${cleanTitle}`.trim() || query;
  if (!q) return null;

  try {
    const res = await axios.get(
      `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&entity=song&limit=3`,
      { timeout: 3500 }
    );
    const results = res.data?.results;
    if (Array.isArray(results) && results.length > 0) {
      for (const item of results) {
        if (item.previewUrl && item.previewUrl.startsWith('http')) {
          return item.previewUrl;
        }
      }
    }
  } catch (err) {
    console.warn('iTunes search error:', err);
  }
  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const trackUrl = searchParams.get('url');
  const title = searchParams.get('title') || '';
  const artist = searchParams.get('artist') || '';
  const query = searchParams.get('q') || `${artist} ${title}`.trim();

  // Cleanly extract preview URL (guard against nested/encoded preview params)
  let rawPreview = searchParams.get('preview') || '';
  while (rawPreview.includes('preview=')) {
    const match = rawPreview.match(/preview=([^&]+)/);
    if (match) {
      rawPreview = decodeURIComponent(match[1]);
    } else {
      break;
    }
  }
  const cleanPreview = rawPreview.startsWith('http') ? rawPreview : '';

  if (!trackUrl && !query && !title && !cleanPreview) {
    return NextResponse.json({ error: 'Missing track parameters' }, { status: 400 });
  }

  const cacheKey = (trackUrl || `${artist} - ${title}` || query).toLowerCase().trim();

  // 1. Check in-memory cache
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.resolvedAt < CACHE_TTL_MS) {
    if (cached.audioUrl) {
      return NextResponse.redirect(cached.audioUrl, 302);
    }
  }

  // 2. Direct SoundCloud track URL
  if (trackUrl && trackUrl.includes('soundcloud.com')) {
    const directUrl = await resolveSoundCloudStream(trackUrl);
    if (directUrl) {
      cache.set(cacheKey, { audioUrl: directUrl, resolvedAt: Date.now() });
      return NextResponse.redirect(directUrl, 302);
    }
  }

  // 3. Search SoundCloud (Full studio tracks via progressive or HLS)
  if (title || artist || query) {
    const scStream = await searchSoundCloudStream(title, artist, query);
    if (scStream) {
      cache.set(cacheKey, { audioUrl: scStream, resolvedAt: Date.now() });
      return NextResponse.redirect(scStream, 302);
    }
  }

  // 4. Deezer Search Fallback (High-quality studio MP3)
  if (title || artist || query) {
    const dzStream = await searchDeezerStream(title, artist, query);
    if (dzStream) {
      cache.set(cacheKey, { audioUrl: dzStream, resolvedAt: Date.now() });
      return NextResponse.redirect(dzStream, 302);
    }
  }

  // 5. Explicit clean preview passed from client
  if (cleanPreview) {
    cache.set(cacheKey, { audioUrl: cleanPreview, resolvedAt: Date.now() });
    return NextResponse.redirect(cleanPreview, 302);
  }

  // 6. iTunes Search Fallback
  if (title || artist || query) {
    const itStream = await searchItunesStream(title, artist, query);
    if (itStream) {
      cache.set(cacheKey, { audioUrl: itStream, resolvedAt: Date.now() });
      return NextResponse.redirect(itStream, 302);
    }
  }

  // Fallback: 1s silent MP3 frame
  return new Response(SILENT_MP3, {
    status: 200,
    headers: {
      'Content-Type': 'audio/mpeg',
      'Accept-Ranges': 'bytes',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    },
  });
}
