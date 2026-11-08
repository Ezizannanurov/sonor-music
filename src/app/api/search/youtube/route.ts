import { NextResponse } from 'next/server';
import axios from 'axios';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { normalizeMusicQuery } from '@/lib/searchQuery';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const execFileAsync = promisify(execFile);

function parseDuration(timeStr?: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(':').map((p) => parseInt(p, 10));
  if (parts.some(isNaN)) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawQuery = searchParams.get('q');

  if (!rawQuery) {
    return NextResponse.json({ error: 'Query parameter q is required' }, { status: 400 });
  }

  const queryVariants = normalizeMusicQuery(rawQuery);
  const query = queryVariants[0] || rawQuery;

  // 1. Direct YouTube Search parser (Fastest: ~300ms)
  try {
    const ytUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const ytRes = await axios.get(ytUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9,ru;q=0.8',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      timeout: 6000,
    });

    const html = ytRes.data;
    const match = html.match(/ytInitialData\s*=\s*({.+?});<\/script>/) || html.match(/ytInitialData\s*=\s*({.+?});/);

    if (match) {
      const data = JSON.parse(match[1]);
      const tracks: any[] = [];

      const walk = (obj: any) => {
        if (!obj || typeof obj !== 'object' || tracks.length >= 25) return;

        if (obj.videoRenderer) {
          const vr = obj.videoRenderer;
          const videoId = vr.videoId;
          const title = vr.title?.runs?.[0]?.text || vr.title?.simpleText || '';
          const author = vr.ownerText?.runs?.[0]?.text || vr.shortBylineText?.runs?.[0]?.text || 'YouTube Music';
          const durStr = vr.lengthText?.simpleText;
          const thumbs = vr.thumbnail?.thumbnails;
          const thumb = (thumbs && thumbs.length > 0) 
            ? thumbs[thumbs.length - 1].url 
            : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

          if (videoId && title) {
            tracks.push({
              id: videoId,
              title,
              artist: author,
              source: 'youtube' as const,
              duration: parseDuration(durStr),
              thumbnail: thumb,
              externalUrl: `https://www.youtube.com/watch?v=${videoId}`,
              streamUrl: `/api/stream/youtube?id=${videoId}&title=${encodeURIComponent(title)}&artist=${encodeURIComponent(author)}`,
            });
          }
          return;
        }

        if (Array.isArray(obj)) {
          for (const item of obj) walk(item);
        } else {
          for (const key of Object.keys(obj)) walk(obj[key]);
        }
      };

      walk(data);

      if (tracks.length > 0) {
        return NextResponse.json({ tracks });
      }
    }
  } catch (directErr) {
    console.warn('Direct YouTube web search error:', directErr);
  }

  // 2. High-reliability fallback: Server-side yt-dlp flat-playlist search
  try {
    const { stdout } = await execFileAsync('yt-dlp', [
      `ytsearch15:${query}`,
      '--dump-single-json',
      '--flat-playlist'
    ], { timeout: 10000 });

    const data = JSON.parse(stdout);
    const entries = data.entries || [];
    if (entries.length > 0) {
      const tracks = entries.map((e: any) => {
        const vid = e.id || e.url;
        const title = e.title || 'Unknown Title';
        const artist = e.uploader || e.channel || 'YouTube Artist';
        const thumb = e.thumbnails?.[e.thumbnails.length - 1]?.url || `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`;
        return {
          id: vid,
          title,
          artist,
          source: 'youtube' as const,
          duration: Number(e.duration) || 0,
          thumbnail: thumb,
          externalUrl: `https://www.youtube.com/watch?v=${vid}`,
          streamUrl: `/api/stream/youtube?id=${vid}&title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`,
        };
      });

      return NextResponse.json({ tracks });
    }
  } catch (ytdlpErr) {
    console.warn('yt-dlp search fallback error:', ytdlpErr);
  }

  // 3. Fallback: Public Invidious instances
  const INVIDIOUS_INSTANCES = [
    'https://inv.nadeko.net',
    'https://invidious.nerdvpn.de',
    'https://yewtu.be',
  ];

  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const response = await axios.get(`${instance}/api/v1/search`, {
        params: {
          q: query,
          type: 'video',
        },
        timeout: 4000,
      });

      if (Array.isArray(response.data)) {
        const tracks = response.data.slice(0, 20).map((item: any) => {
          const thumbnail = item.videoThumbnails?.find((t: any) => t.quality === 'medium')?.url 
            || item.videoThumbnails?.[0]?.url 
            || `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`;

          return {
            id: item.videoId,
            title: item.title,
            artist: item.author || 'YouTube Artist',
            source: 'youtube' as const,
            duration: Number(item.lengthSeconds) || 0,
            thumbnail: thumbnail,
            externalUrl: `https://www.youtube.com/watch?v=${item.videoId}`,
            streamUrl: `/api/stream/youtube?id=${item.videoId}&title=${encodeURIComponent(item.title || '')}&artist=${encodeURIComponent(item.author || '')}`,
          };
        });

        return NextResponse.json({ tracks });
      }
    } catch {
      continue;
    }
  }

  return NextResponse.json({ tracks: [] });
}
