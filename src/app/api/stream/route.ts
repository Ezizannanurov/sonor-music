import { NextResponse } from 'next/server';
import scdl from 'soundcloud-scraper';
import { Readable } from 'stream';
import { execFile } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const execFileAsync = promisify(execFile);
const client = new scdl.Client();

// In-memory cache for resolved track URLs to make seeks and repeats instant
interface CachedTrack {
  audioUrl?: string;
  songInfo?: any;
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

function transliterate(str: string): string {
  const ru: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh',
    з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
    п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts',
    ч: 'ch', ш: 'sh', щ: 'shch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya'
  };
  return str.split('').map(ch => {
    const l = ch.toLowerCase();
    return ru[l] !== undefined ? ru[l] : ch;
  }).join('');
}

/**
 * High-accuracy audio resolver using server-side yt-dlp.
 * Resolves full-length studio audio for any query or title+artist in 1-2s.
 */
async function resolveYtAudioUrl(searchTerm: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync('yt-dlp', [
      '-g',
      '-f', 'ba/b',
      '--extractor-args', 'youtube:player_client=android,ios',
      '--no-warnings',
      `ytsearch1:${searchTerm}`,
    ], { timeout: 15000 });

    const directUrl = stdout.trim();
    if (directUrl && directUrl.startsWith('http')) {
      return directUrl;
    }
  } catch (err) {
    console.warn(`yt-dlp failed for "${searchTerm}":`, err);
  }
  return null;
}

/**
 * Resolves full-length studio MP3 audio from secondary catalog databases
 */
async function resolveFullMp3Url(title: string, artist: string, query: string): Promise<string | null> {
  const cleanTitle = (title || '').replace(/[\(\[\{].*?[\)\]\}]/g, '').trim();
  const cleanArtist = (artist || '').split(/[&,xX/]/)[0].trim();

  const searchTerms: string[] = [];
  if (cleanTitle) searchTerms.push(cleanTitle);
  if (cleanArtist && cleanTitle && !searchTerms.includes(`${cleanArtist} ${cleanTitle}`)) {
    searchTerms.push(`${cleanArtist} ${cleanTitle}`);
  }
  if (query && !searchTerms.includes(query)) {
    searchTerms.push(query);
  }

  for (const term of searchTerms) {
    try {
      const url = `https://mp3uk.net/search/?q=${encodeURIComponent(term)}`;
      const res = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8',
        },
        timeout: 6000,
      });

      const hostMatch = res.data.match(/https:\/\/([a-z0-9-]+)\.mp3uk\.net\//i);
      const subdomain = hostMatch ? `https://${hostMatch[1]}.mp3uk.net` : 'https://mp3uk.net';

      const items = res.data.split('class="track-item');
      if (items.length <= 1) continue;

      const candidates: { title: string; artist: string; audioUrl: string }[] = [];
      for (const item of items.slice(1)) {
        const tr = item.match(/data-track="([^"]+)"/);
        const ti = item.match(/data-title="([^"]+)"/);
        const ar = item.match(/data-artist="([^"]+)"/);
        if (tr) {
          const cTitle = (ti ? ti[1] : '').toLowerCase();
          const cArtist = (ar ? ar[1] : '').toLowerCase();
          const audioUrl = tr[1].startsWith('http') ? tr[1] : `${subdomain}${tr[1]}`;
          candidates.push({ title: cTitle, artist: cArtist, audioUrl });
        }
      }

      if (candidates.length === 0) continue;

      const targetTitle = (cleanTitle || title || '').toLowerCase().trim();
      const targetArtist = (cleanArtist || artist || '').toLowerCase().trim();

      if (targetTitle && targetArtist) {
        const best = candidates.find(
          (c) => c.title.includes(targetTitle) && (c.artist.includes(targetArtist) || targetArtist.includes(c.artist))
        );
        if (best) return best.audioUrl;
      }

      if (targetTitle) {
        const titleMatch = candidates.find((c) => c.title.includes(targetTitle) || targetTitle.includes(c.title));
        if (titleMatch) return titleMatch.audioUrl;
      }

      return candidates[0].audioUrl;
    } catch {
      continue;
    }
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

  const range = request.headers.get('range');

  const streamFromUrl = async (audioUrl: string) => {
    try {
      const axiosRes = await axios.get(audioUrl, {
        responseType: 'stream',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          ...(range ? { range } : {}),
        },
        timeout: 15000,
      });

      if (typeof axiosRes?.data?.on === 'function') {
        axiosRes.data.on('error', () => {});
      }
      const nodeStream = Readable.toWeb(axiosRes.data) as ReadableStream;
      const headers: Record<string, string> = {
        'Content-Type': String(axiosRes.headers['content-type'] || 'audio/mpeg'),
        'Accept-Ranges': 'bytes',
      };
      if (axiosRes.headers['content-range']) headers['Content-Range'] = String(axiosRes.headers['content-range']);
      if (axiosRes.headers['content-length']) headers['Content-Length'] = String(axiosRes.headers['content-length']);

      return new Response(nodeStream, {
        status: range && axiosRes.headers['content-range'] ? 206 : 200,
        headers,
      });
    } catch {
      // If direct proxy fails, fallback to redirect
      const absUrl = audioUrl.startsWith('http') ? audioUrl : new URL(audioUrl, request.url).toString();
      return NextResponse.redirect(absUrl);
    }
  };

  if (!trackUrl && !query && !title) {
    if (cleanPreview) {
      return await streamFromUrl(cleanPreview);
    }
    return NextResponse.json({ error: 'Missing track url or search query' }, { status: 400 });
  }

  const cacheKey = (trackUrl || `${artist} - ${title}` || query).toLowerCase().trim();

  // 1. Check in-memory cache for resolved track URL
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.resolvedAt < CACHE_TTL_MS) {
    if (cached.audioUrl) {
      return await streamFromUrl(cached.audioUrl);
    }
  }

  // 2. Primary: High-fidelity audio resolver via server-side yt-dlp (YouTube / YouTube Music)
  const searchQuery = `${artist} ${title}`.trim() || query;
  if (searchQuery) {
    try {
      const ytDirectUrl = await resolveYtAudioUrl(searchQuery);
      if (ytDirectUrl) {
        cache.set(cacheKey, { audioUrl: ytDirectUrl, resolvedAt: Date.now() });
        return await streamFromUrl(ytDirectUrl);
      }
    } catch (e) {
      console.warn('yt-dlp primary resolver error:', e);
    }
  }

  // 3. Secondary: SoundCloud Scraper (if explicit trackUrl was passed)
  if (trackUrl) {
    try {
      let songInfo: any = cached?.songInfo || null;
      if (!songInfo) {
        songInfo = await client.getSongInfo(trackUrl).catch(() => null);
        if (songInfo) {
          cache.set(cacheKey, { songInfo, resolvedAt: Date.now() });
        }
      }

      if (songInfo) {
        try {
          const streamOptions: any = {};
          if (range) streamOptions.headers = { range };
          const stream: any = await songInfo.downloadProgressive(streamOptions);
          if (typeof stream?.on === 'function') {
            stream.on('error', () => {});
          }
          const nodeStream = Readable.toWeb(stream) as ReadableStream;
          const headers: Record<string, string> = {
            'Content-Type': 'audio/mpeg',
            'Accept-Ranges': 'bytes',
          };
          if (stream.headers?.['content-range']) headers['Content-Range'] = stream.headers['content-range'];
          if (stream.headers?.['content-length']) headers['Content-Length'] = stream.headers['content-length'];

          return new Response(nodeStream, {
            status: range && stream.headers?.['content-range'] ? 206 : 200,
            headers,
          });
        } catch {
          // If progressive fails, try HLS
          const hlsStream = await songInfo.downloadHLS();
          if (typeof hlsStream?.on === 'function') {
            hlsStream.on('error', () => {});
          }
          const nodeStream = Readable.toWeb(hlsStream) as ReadableStream;
          return new Response(nodeStream, {
            headers: {
              'Content-Type': 'audio/mpeg',
              'Accept-Ranges': 'bytes',
            },
          });
        }
      }
    } catch (scErr) {
      console.warn('SoundCloud direct streaming error:', scErr);
    }
  }

  // 4. Tertiary: Catalog MP3 resolver
  if (title || query) {
    try {
      const fullMp3 = await resolveFullMp3Url(title, artist, query);
      if (fullMp3) {
        cache.set(cacheKey, { audioUrl: fullMp3, resolvedAt: Date.now() });
        return await streamFromUrl(fullMp3);
      }
    } catch (e) {
      console.warn('Full MP3 resolver error:', e);
    }
  }

  // 5. Fallback: 30s previewUrl or silent frame if completely unavailable
  if (cleanPreview) {
    return await streamFromUrl(cleanPreview);
  }

  return new Response(SILENT_MP3, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Accept-Ranges': 'bytes',
    },
  });
}
