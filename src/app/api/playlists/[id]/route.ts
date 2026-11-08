import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { updatePlaylist, deletePlaylist, getPlaylistById } from '@/lib/db';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const existing = getPlaylistById(id);
    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: 'Плейлист не найден' }, { status: 404 });
    }

    const updated = updatePlaylist(id, body, user.id);
    return NextResponse.json({ success: true, playlist: updated });
  } catch (err) {
    console.error('Update playlist error:', err);
    return NextResponse.json({ error: 'Failed to update playlist' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 });
    }

    const { id } = await params;
    const success = deletePlaylist(id, user.id);
    return NextResponse.json({ success });
  } catch (err) {
    console.error('Delete playlist error:', err);
    return NextResponse.json({ error: 'Failed to delete playlist' }, { status: 500 });
  }
}
