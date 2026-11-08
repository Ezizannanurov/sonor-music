import { NextResponse } from 'next/server';
import axios from 'axios';
import scdl from 'soundcloud-scraper';

const scClient = new scdl.Client();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get('url');

  if (!rawUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  const cleanUrl = rawUrl.trim();

  // 1. Spotify Track Link
  if (cleanUrl.includes('open.spotify.com/track') || cleanUrl.includes('spotify.link')) {
    try {
      const oembedRes = await axios.get(
        `https://open.spotify.com/oembed?url=${encodeURIComponent(cleanUrl)}`,
        { timeout: 8000 }
      );
      const data = oembedRes.data;
      const fullTitle = data.title || 'Spotify Track';
      // Often formatted as "Track Name by Artist Name" or just "Track Name"
      let trackTitle = fullTitle;
      let artistName = 'Spotify Artist';

      if (fullTitle.includes(' by ')) {
        const parts = fullTitle.split(' by ');
        trackTitle = parts[0].trim();
        artistName = parts.slice(1).join(' by ').trim();
      }

      const track = {
        id: `spotify-${Date.now()}`,
        title: trackTitle,
        artist: artistName,
        source: 'spotify' as const,
        duration: 0,
        thumbnail: data.thumbnail_url || '',
        externalUrl: cleanUrl,
        streamUrl: `/api/stream?title=${encodeURIComponent(trackTitle)}&artist=${encodeURIComponent(artistName)}&q=${encodeURIComponent(`${artistName} ${trackTitle}`)}`,
      };

      return NextResponse.json({ tracks: [track] });
    } catch (err: any) {
      console.warn('Spotify link resolution error:', err.message);
      return NextResponse.json({ error: 'Could not resolve Spotify track link' }, { status: 500 });
    }
  }

  // 2. YouTube Link
  if (cleanUrl.includes('youtube.com/watch') || cleanUrl.includes('youtu.be/')) {
    try {
      let videoId = '';
      if (cleanUrl.includes('youtu.be/')) {
        videoId = cleanUrl.split('youtu.be/')[1]?.split('?')[0]?.split('&')[0] || '';
      } else {
        const urlObj = new URL(cleanUrl);
        videoId = urlObj.searchParams.get('v') || '';
      }

      if (videoId) {
        const oembedRes = await axios.get(
          `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`,
          { timeout: 6000 }
        );
        const data = oembedRes.data;

        const track = {
          id: videoId,
          title: data.title || 'YouTube Track',
          artist: data.author_name || 'YouTube Artist',
          source: 'youtube' as const,
          duration: 0,
          thumbnail: data.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          externalUrl: `https://www.youtube.com/watch?v=${videoId}`,
          streamUrl: `/api/stream/youtube?id=${videoId}&title=${encodeURIComponent(data.title || '')}&artist=${encodeURIComponent(data.author_name || '')}`,
        };

        return NextResponse.json({ tracks: [track] });
      }
    } catch (err: any) {
      console.warn('YouTube link resolution error:', err.message);
      return NextResponse.json({ error: 'Could not resolve YouTube link' }, { status: 500 });
    }
  }

  // 3. SoundCloud Link
  if (cleanUrl.includes('soundcloud.com/')) {
    try {
      const info = (await scClient.getSongInfo(cleanUrl)) as any;
      if (info) {
        const artistName = info.author?.name || info.artist || 'SoundCloud Artist';
        const track = {
          id: cleanUrl,
          title: info.title || 'SoundCloud Track',
          artist: artistName,
          source: 'soundcloud' as const,
          duration: Math.round((info.duration || 0) / 1000),
          thumbnail: info.thumbnail || '',
          externalUrl: cleanUrl,
          streamUrl: `/api/stream?url=${encodeURIComponent(cleanUrl)}&title=${encodeURIComponent(info.title || '')}&artist=${encodeURIComponent(artistName)}`,
        };
        return NextResponse.json({ tracks: [track] });
      }
    } catch (err: any) {
      console.warn('SoundCloud link resolution error:', err.message);
      return NextResponse.json({ error: 'Could not resolve SoundCloud link' }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Unsupported link format' }, { status: 400 });
}
