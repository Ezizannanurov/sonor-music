import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, getUserByUsername, createUser, DBUser } from '@/lib/db';
import { hashPassword, createSessionToken, setSessionCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, email, password, avatar } = body;

    const cleanUser = username?.trim();
    const cleanEmail = email?.trim().toLowerCase();

    if (!cleanUser || !cleanEmail || !password) {
      return NextResponse.json(
        { error: 'Заполните все обязательные поля' },
        { status: 400 }
      );
    }

    if (password.length < 3) {
      return NextResponse.json(
        { error: 'Пароль должен быть не менее 3 символов' },
        { status: 400 }
      );
    }

    if (getUserByEmail(cleanEmail)) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже зарегистрирован' },
        { status: 400 }
      );
    }

    if (getUserByUsername(cleanUser)) {
      return NextResponse.json(
        { error: 'Это имя пользователя уже занято' },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);
    const newUser: DBUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      username: cleanUser,
      email: cleanEmail,
      avatar: avatar || 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
      createdAt: Date.now(),
      passwordHash,
    };

    createUser(newUser);

    const { passwordHash: _, ...safeUser } = newUser;
    const token = await createSessionToken(safeUser);
    await setSessionCookie(token);

    return NextResponse.json({ success: true, user: safeUser });
  } catch (err) {
    console.error('Registration error:', err);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
