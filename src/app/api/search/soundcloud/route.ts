import { NextResponse } from 'next/server';
import scdl from 'soundcloud-scraper';
import { normalizeMusicQuery } from '@/lib/searchQuery';

const client = new scdl.Client();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawQuery = searchParams.get('q');

  if (!rawQuery) {
    return NextResponse.json({ error: 'Query parameter q is required' }, { status: 400 });
  }

  const queryVariants = normalizeMusicQuery(rawQuery);
  const seenUrls = new Set<string>();
  const allTracks: any[] = [];

  for (const query of queryVariants) {
    try {
      const results = (await client.search(query, 'track').catch(() => [])) as any[];
      if (Array.isArray(results) && results.length > 0) {
        for (const item of results) {
          if (item.url && !seenUrls.has(item.url)) {
            seenUrls.add(item.url);
            allTracks.push({
              id: item.url || String(Math.random()),
              title: item.name || item.title || 'Unknown Title',
              artist: typeof item.artist === 'string' ? item.artist : item.artist?.name || 'SoundCloud Artist',
              source: 'soundcloud' as const,
              duration: Math.round((item.duration || 0) / 1000),
              thumbnail: item.thumbnail || '',
              externalUrl: item.url,
              streamUrl: `/api/stream?url=${encodeURIComponent(item.url)}&title=${encodeURIComponent(item.name || item.title || '')}&artist=${encodeURIComponent(typeof item.artist === 'string' ? item.artist : item.artist?.name || '')}`,
            });
          }
        }
      }

      if (allTracks.length >= 10) break;
    } catch {
      continue;
    }
  }

  return NextResponse.json({ tracks: allTracks.slice(0, 20) });
}
