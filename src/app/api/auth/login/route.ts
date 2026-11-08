import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, getUserByUsername } from '@/lib/db';
import { verifyPassword, createSessionToken, setSessionCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { login, password } = body;

    const query = login?.trim();
    if (!query || !password) {
      return NextResponse.json(
        { error: 'Введите логин/email и пароль' },
        { status: 400 }
      );
    }

    const user = getUserByEmail(query) || getUserByUsername(query);
    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Неверный пароль' },
        { status: 401 }
      );
    }

    const { passwordHash: _, ...safeUser } = user;
    const token = await createSessionToken(safeUser);
    await setSessionCookie(token);

    return NextResponse.json({ success: true, user: safeUser });
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
