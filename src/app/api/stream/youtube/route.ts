import { NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';
import { resolveFullMp3Url, streamAudioResponse, SILENT_MP3 } from '@/lib/mp3Resolver';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const execFileAsync = promisify(execFile);

// Cache resolved direct stream URLs to make playback, repeat and seek instant
const streamCache = new Map<string, { url: string; expires: number }>();
const CACHE_TTL_MS = 50 * 60 * 1000; // 50 minutes

async function resolveDirectAudioUrl(videoId: string): Promise<string | null> {
  const cached = streamCache.get(videoId);
  if (cached && Date.now() < cached.expires) {
    return cached.url;
  }

  // 1. Resolve using server-side yt-dlp
  try {
    const { stdout } = await execFileAsync('yt-dlp', [
      '-g',
      '-f', 'ba/b',
      '--extractor-args', 'youtube:player_client=android,ios',
      '--no-warnings',
      `https://www.youtube.com/watch?v=${videoId}`,
    ], { timeout: 15000 });

    const directUrl = stdout.trim();
    if (directUrl && directUrl.startsWith('http')) {
      streamCache.set(videoId, { url: directUrl, expires: Date.now() + CACHE_TTL_MS });
      return directUrl;
    }
  } catch (ytdlpErr) {
    console.warn(`yt-dlp failed for ${videoId}:`, ytdlpErr);
  }

  // 2. Fallback to public Invidious instances
  const INVIDIOUS_INSTANCES = [
    'https://inv.nadeko.net',
    'https://invidious.nerdvpn.de',
    'https://yewtu.be',
  ];

  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const response = await axios.get(`${instance}/api/v1/videos/${videoId}`, {
        timeout: 4000,
      });

      const audioStreams = response.data?.adaptiveFormats?.filter(
        (f: any) => f.type?.includes('audio')
      );

      if (audioStreams && audioStreams.length > 0) {
        const bestAudio = audioStreams[audioStreams.length - 1];
        if (bestAudio?.url) {
          return bestAudio.url;
        }
      }
    } catch {
      continue;
    }
  }

  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('id');

  if (!videoId) {
    return NextResponse.json({ error: 'videoId is required' }, { status: 400 });
  }

  let title = searchParams.get('title') || '';
  let artist = searchParams.get('artist') || '';
  const range = request.headers.get('range');

  // 1. First attempt: resolve via yt-dlp / Invidious
  try {
    const directAudioUrl = await resolveDirectAudioUrl(videoId);
    if (directAudioUrl) {
      return await streamAudioResponse(directAudioUrl, range);
    }
  } catch (err) {
    console.warn('Direct stream resolver error:', err);
  }

  // 2. If title or artist are missing, fetch them via YouTube oEmbed (fast & never blocked)
  if (!title && !artist) {
    try {
      const oembedRes = await axios.get(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
        { timeout: 3500 }
      );
      if (oembedRes.data) {
        title = oembedRes.data.title || '';
        artist = oembedRes.data.author_name || '';
      }
    } catch (e) {
      console.warn('oEmbed fetch error for videoId', videoId, e);
    }
  }

  // 3. Fallback: Resolve full studio MP3 directly by title and artist
  if (title || artist) {
    const searchQuery = `${artist} ${title}`.trim();
    try {
      const mp3Url = await resolveFullMp3Url(title, artist, searchQuery);
      if (mp3Url) {
        return await streamAudioResponse(mp3Url, range);
      }
    } catch (mp3Err) {
      console.warn('MP3 catalog fallback error:', mp3Err);
    }
  }

  // 4. Ultimate fallback: 1-second silent MP3 so audio player doesn't crash or throw 500
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
