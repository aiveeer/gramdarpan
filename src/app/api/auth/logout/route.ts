import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('session_user_id')?.value;
    const sessionId = cookieStore.get('session_id')?.value;

    if (sessionId) {
      await db.userSession.update({
        where: { id: sessionId },
        data: { logoutAt: new Date(), action: 'logout' },
      }).catch(() => {});
    }

    if (userId) {
      await db.auditLog.create({
        data: {
          userId,
          action: 'LOGOUT',
          module: 'AUTH',
          details: 'User logged out',
        },
      }).catch(() => {});
    }

    cookieStore.delete('session_user_id');
    cookieStore.delete('session_user_role');
    cookieStore.delete('session_id');

    return NextResponse.json({ message: 'Logged out' });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}
