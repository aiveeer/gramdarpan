import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('session_user_id')?.value;
    const sessionId = cookieStore.get('session_id')?.value;

    if (!userId) {
      return NextResponse.json({ authenticated: false });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        name: true,
        nameMarathi: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json({ authenticated: false });
    }

    // Get login time from session
    let loginAt: string | null = null;
    if (sessionId) {
      const session = await db.userSession.findUnique({
        where: { id: sessionId },
        select: { loginAt: true },
      });
      if (session) {
        loginAt = session.loginAt.toISOString();
      }
    }

    return NextResponse.json({
      authenticated: true,
      user,
      loginAt,
    });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}
