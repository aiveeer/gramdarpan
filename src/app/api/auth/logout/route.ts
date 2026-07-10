import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('session_user_id')?.value;
    const sessionId = cookieStore.get('session_id')?.value;

    // Update session record
    if (sessionId) {
      await db.userSession.update({
        where: { id: sessionId },
        data: { logoutAt: new Date(), action: 'logout' },
      }).catch(() => {});
    }

    // Create audit log
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

    // Clear cookies
    const response = NextResponse.json({ message: 'Logged out' });
    response.cookies.set('session_user_id', '', { maxAge: 0, path: '/', secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
    response.cookies.set('session_user_role', '', { maxAge: 0, path: '/', secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
    response.cookies.set('session_id', '', { maxAge: 0, path: '/', secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    // Still clear cookies even if DB fails
    const response = NextResponse.json({ message: 'Logged out' });
    response.cookies.set('session_user_id', '', { maxAge: 0, path: '/' });
    response.cookies.set('session_user_role', '', { maxAge: 0, path: '/' });
    response.cookies.set('session_id', '', { maxAge: 0, path: '/' });
    return response;
  }
}
