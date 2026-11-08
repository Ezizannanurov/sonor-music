import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getFavoritesByUserId, toggleFavorite } from '@/lib/db';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ favorites: [] });
    }

    const favorites = getFavoritesByUserId(user.id);
    return NextResponse.json({ favorites });
  } catch (err) {
    console.error('Fetch favorites error:', err);
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 });
    }

    const body = await req.json();
    const { track } = body;
    if (!track?.id) {
      return NextResponse.json({ error: 'Некорректный трек' }, { status: 400 });
    }

    const result = toggleFavorite(user.id, track);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error('Toggle favorite error:', err);
    return NextResponse.json({ error: 'Failed to toggle favorite' }, { status: 500 });
  }
}
