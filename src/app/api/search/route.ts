import { NextResponse } from 'next/server';
import axios from 'axios';
import scdl from 'soundcloud-scraper';
import { normalizeMusicQuery } from '@/lib/searchQuery';
import { Track } from '@/types/track';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const scClient = new scdl.Client();

// Helper to normalize strings for comparison & deduplication
function cleanText(str: string): string {
  return (str || '')
    .toLowerCase()
    .replace(/[\(\[\{].*?[\)\]\}]/g, '') // remove (feat. ...), [official video], etc.
    .replace(/\b(official|music|video|audio|lyrics|hd|hq|remastered|version|edit)\b/gi, '')
    .replace(/[^a-zа-я0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getTrackFingerprint(title: string, artist: string): string {
  const cTitle = cleanText(title);
  const cArtist = cleanText(artist.split(/[&,xX/]/)[0]);
  return `${cArtist}:::${cTitle}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawQuery = searchParams.get('q');

  if (!rawQuery || !rawQuery.trim()) {
    return NextResponse.json({ error: 'Query parameter q is required' }, { status: 400 });
  }

  const queryVariants = normalizeMusicQuery(rawQuery.trim());
  const primaryQuery = queryVariants[0] || rawQuery.trim();

  const candidates: Track[] = [];
  const seenFingerprints = new Map<string, Track>();

  // 1. Fetch iTunes Catalog (highest metadata accuracy, high-res covers, studio artists)
  const itunesPromise = (async () => {
    try {
      const res = await axios.get('https://itunes.apple.com/search', {
        params: {
          term: primaryQuery,
          media: 'music',
          entity: 'song',
          limit: 25,
        },
        timeout: 4000,
      });

      const results = res.data?.results || [];
      for (const item of results) {
        if (!item.trackName || !item.artistName) continue;
        const title = item.trackName.trim();
        const artist = item.artistName.trim();
        const thumb = item.artworkUrl100
          ? item.artworkUrl100.replace('100x100bb', '600x600bb')
          : '';

        const fp = getTrackFingerprint(title, artist);
        const track: Track = {
          id: `it-${item.trackId}`,
          title,
          artist,
          source: 'spotify', // Unified internal type
          duration: Math.round((item.trackTimeMillis || 0) / 1000),
          thumbnail: thumb,
          streamUrl: `/api/stream?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}&preview=${encodeURIComponent(item.previewUrl || '')}`,
          externalUrl: item.trackViewUrl,
        };

        if (!seenFingerprints.has(fp)) {
          seenFingerprints.set(fp, track);
          candidates.push(track);
        }
      }
    } catch (err) {
      console.warn('iTunes search error:', err);
    }
  })();

  // 2. Fetch SoundCloud Catalog (full tracks, phonk, remixes, underground releases)
  const soundcloudPromise = (async () => {
    try {
      const results = (await scClient.search(primaryQuery, 'track').catch(() => [])) as any[];
      if (Array.isArray(results)) {
        for (const item of results.slice(0, 20)) {
          if (!item.url || !item.name) continue;
          const title = (item.name || item.title || '').trim();
          const artist = (typeof item.artist === 'string' ? item.artist : item.artist?.name || 'Artist').trim();
          const thumb = item.thumbnail || '';

          const fp = getTrackFingerprint(title, artist);

          // If this song already exists from iTunes, iTunes metadata/artwork is preferred
          if (!seenFingerprints.has(fp)) {
            const track: Track = {
              id: `sc-${Buffer.from(item.url).toString('base64').slice(0, 16)}`,
              title,
              artist,
              source: 'soundcloud',
              duration: Math.round((item.duration || 0) / 1000),
              thumbnail: thumb,
              streamUrl: `/api/stream?url=${encodeURIComponent(item.url)}&title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`,
              externalUrl: item.url,
            };
            seenFingerprints.set(fp, track);
            candidates.push(track);
          }
        }
      }
    } catch (err) {
      console.warn('SoundCloud search error:', err);
    }
  })();

  await Promise.allSettled([itunesPromise, soundcloudPromise]);

  // Return clean, deduplicated list (each unique song appears only ONCE)
  return NextResponse.json({ tracks: candidates.slice(0, 30) });
}
