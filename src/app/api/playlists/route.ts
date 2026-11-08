import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getPlaylistsByUserId, createPlaylist } from '@/lib/db';
import { Playlist } from '@/types/playlist';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ playlists: [] });
    }

    const playlists = getPlaylistsByUserId(user.id);
    return NextResponse.json({ playlists });
  } catch (err) {
    console.error('Fetch playlists error:', err);
    return NextResponse.json({ error: 'Failed to fetch playlists' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, coverColor } = body;

    const newPlaylist: Playlist = {
      id: `pl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: title?.trim() || 'Новый плейлист',
      description: description?.trim() || '',
      coverColor: coverColor || '#6366f1',
      tracks: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      userId: user.id,
    };

    createPlaylist(newPlaylist);
    return NextResponse.json({ success: true, playlist: newPlaylist });
  } catch (err) {
    console.error('Create playlist error:', err);
    return NextResponse.json({ error: 'Failed to create playlist' }, { status: 500 });
  }
}
