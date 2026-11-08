import axios from 'axios';
import { Readable } from 'stream';

export const SILENT_MP3 = Buffer.from([
  0xff, 0xfb, 0x90, 0x64, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
]);

/**
 * Resolves full-length studio MP3 audio from secondary catalog databases
 */
export async function resolveFullMp3Url(
  title: string,
  artist: string,
  query?: string
): Promise<string | null> {
  const cleanTitle = (title || '')
    .replace(/[\(\[\{].*?[\)\]\}]/g, '')
    .replace(/\b(official|audio|video|lyrics|hd|hq|remastered)\b/gi, '')
    .trim();
  const cleanArtist = (artist || '').split(/[&,xX/]/)[0].trim();

  const searchTerms: string[] = [];
  if (cleanTitle && cleanArtist) {
    searchTerms.push(`${cleanArtist} ${cleanTitle}`);
  }
  if (cleanTitle) {
    searchTerms.push(cleanTitle);
  }
  if (query && !searchTerms.includes(query)) {
    searchTerms.push(query);
  }

  for (const term of searchTerms) {
    try {
      const url = `https://mp3uk.net/search/?q=${encodeURIComponent(term)}`;
      const res = await axios.get(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
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
          (c) =>
            c.title.includes(targetTitle) &&
            (c.artist.includes(targetArtist) || targetArtist.includes(c.artist))
        );
        if (best) return best.audioUrl;
      }

      if (targetTitle) {
        const titleMatch = candidates.find(
          (c) => c.title.includes(targetTitle) || targetTitle.includes(c.title)
        );
        if (titleMatch) return titleMatch.audioUrl;
      }

      return candidates[0].audioUrl;
    } catch {
      continue;
    }
  }

  return null;
}

/**
 * Streams audio from remote URL through server Response with range, chunking and CORS headers.
 */
export async function streamAudioResponse(
  audioUrl: string,
  range?: string | null
): Promise<Response> {
  try {
    const axiosRes = await axios.get(audioUrl, {
      responseType: 'stream',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
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
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    };

    if (axiosRes.headers['content-range']) {
      headers['Content-Range'] = String(axiosRes.headers['content-range']);
    }
    if (axiosRes.headers['content-length']) {
      headers['Content-Length'] = String(axiosRes.headers['content-length']);
    }

    return new Response(nodeStream, {
      status: range && axiosRes.headers['content-range'] ? 206 : 200,
      headers,
    });
  } catch (err) {
    console.warn(`streamAudioResponse failed for ${audioUrl}:`, err);
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
}
