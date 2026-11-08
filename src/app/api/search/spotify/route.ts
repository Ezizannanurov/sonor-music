import { NextResponse } from 'next/server';
import axios from 'axios';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { normalizeMusicQuery } from '@/lib/searchQuery';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const execFileAsync = promisify(execFile);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawQuery = searchParams.get('q');

  if (!rawQuery) {
    return NextResponse.json({ error: 'Query parameter q is required' }, { status: 400 });
  }

  const queryVariants = normalizeMusicQuery(rawQuery).slice(0, 2);
  const tracks: any[] = [];
  const seenIds = new Set<string>();

  // 1. Try iTunes Music API for mainstream catalog hits
  for (const query of queryVariants) {
    try {
      const res = await axios.get('https://itunes.apple.com/search', {
        params: {
          term: query,
          media: 'music',
          entity: 'song',
          limit: 15,
        },
        timeout: 3000,
      });

      const results = res.data.results || [];
      for (const item of results) {
        const id = String(item.trackId);
        if (!seenIds.has(id)) {
          seenIds.add(id);
          tracks.push({
            id,
            title: item.trackName || 'Без названия',
            artist: item.artistName || 'Неизвестный исполнитель',
            source: 'spotify' as const,
            duration: Math.round((item.trackTimeMillis || 0) / 1000),
            thumbnail: item.artworkUrl100?.replace('100x100bb', '300x300bb') || '',
            streamUrl: `/api/stream?title=${encodeURIComponent(item.trackName || '')}&artist=${encodeURIComponent(item.artistName || '')}&preview=${encodeURIComponent(item.previewUrl || '')}`,
            externalUrl: item.trackViewUrl,
          });
        }
      }

      if (tracks.length >= 10) break;
    } catch {
      continue;
    }
  }

  // 2. High-availability Fallback & Augmentation:
  // If catalog has fewer than 5 tracks (common for indie, gaming OSTs, FNF mods),
  // augment with full studio releases from universal index so the user always gets the genuine song!
  if (tracks.length < 5) {
    try {
      const primaryQuery = queryVariants[0] || rawQuery;
      const { stdout } = await execFileAsync('yt-dlp', [
        `ytsearch12:${primaryQuery}`,
        '--dump-single-json',
        '--flat-playlist'
      ], { timeout: 8000 });

      const data = JSON.parse(stdout);
      const entries = data.entries || [];
      for (const e of entries) {
        const vid = e.id || e.url;
        if (vid && !seenIds.has(vid)) {
          seenIds.add(vid);
          const title = e.title || 'Unknown Title';
          const artist = e.uploader || e.channel || 'Artist';
          const thumb = e.thumbnails?.[e.thumbnails.length - 1]?.url || `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`;
          tracks.push({
            id: `sp-${vid}`,
            title,
            artist,
            source: 'spotify' as const,
            duration: Number(e.duration) || 0,
            thumbnail: thumb,
            externalUrl: `https://www.youtube.com/watch?v=${vid}`,
            streamUrl: `/api/stream/youtube?id=${vid}&title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`,
          });
        }
      }
    } catch (err) {
      console.warn('Universal catalog augmentation error:', err);
    }
  }

  return NextResponse.json({ tracks });
}
