import { NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { Readable } from 'stream';
import axios from 'axios';

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

  const title = searchParams.get('title') || '';
  const artist = searchParams.get('artist') || '';
  const range = request.headers.get('range');

  try {
    const directAudioUrl = await resolveDirectAudioUrl(videoId);

    if (directAudioUrl) {
      try {
        const axiosRes = await axios.get(directAudioUrl, {
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
          'Content-Type': String(axiosRes.headers['content-type'] || 'audio/webm'),
          'Accept-Ranges': 'bytes',
        };
        if (axiosRes.headers['content-range']) headers['Content-Range'] = String(axiosRes.headers['content-range']);
        if (axiosRes.headers['content-length']) headers['Content-Length'] = String(axiosRes.headers['content-length']);

        return new Response(nodeStream, {
          status: range && axiosRes.headers['content-range'] ? 206 : 200,
          headers,
        });
      } catch (streamErr) {
        console.warn('Direct stream proxy error, falling back to redirect:', streamErr);
        return NextResponse.redirect(directAudioUrl);
      }
    }
  } catch (err) {
    console.error('YouTube stream resolver error:', err);
  }

  // 3. Ultimate Fallback: Redirect to universal MP3 / SoundCloud resolver by title & artist
  if (title || artist) {
    return NextResponse.redirect(
      new URL(
        `/api/stream?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}&q=${encodeURIComponent(`${artist} ${title}`.trim())}`,
        request.url
      )
    );
  }

  return NextResponse.json({ error: 'Could not resolve audio stream' }, { status: 500 });
}
