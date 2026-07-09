import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Read cookies using next/headers (for reading)
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

    // Clear cookies via NextResponse (compatible with Next.js 16)
    const response = NextResponse.json({ message: 'Logged out' });
    response.cookies.set('session_user_id', '', { maxAge: 0, path: '/' });
    response.cookies.set('session_user_role', '', { maxAge: 0, path: '/' });
    response.cookies.set('session_id', '', { maxAge: 0, path: '/' });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}
