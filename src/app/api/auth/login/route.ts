import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// Simple hash function for passwords (in production, use bcrypt)
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // true on Vercel (HTTPS), false on local (HTTP)
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24, // 24 hours
  path: '/',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Seed default users
    if (body.action === 'seed') {
      const existing = await db.user.count();
      if (existing > 0) {
        return NextResponse.json({ message: 'Users already exist', count: existing });
      }
      await db.user.createMany({
        data: [
          {
            username: 'gpo',
            password: simpleHash('gpo123'),
            name: 'Gram Panchayat Officer',
            nameMarathi: 'ग्रामपंचायत अधिकारी',
            role: 'gpo',
          },
          {
            username: 'operator',
            password: simpleHash('op123'),
            name: 'Operator',
            nameMarathi: 'ऑपरेटर',
            role: 'operator',
          },
        ],
      });
      return NextResponse.json({ message: 'Default users created' });
    }

    // Login
    const { username, password } = body;
    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { username } });
    if (!user || user.password !== simpleHash(password)) {
      return NextResponse.json({ error: 'अवैध युजरनेम किंवा पासवर्ड' }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'खाते निष्क्रिय आहे' }, { status: 403 });
    }

    // Create session log
    const session = await db.userSession.create({
      data: {
        userId: user.id,
        action: 'login',
        userAgent: request.headers.get('user-agent') || undefined,
      },
    });

    // Log audit
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        module: 'AUTH',
        details: `User ${user.username} logged in`,
      },
    });

    // Set cookies via NextResponse (compatible with Next.js 16)
    const response = NextResponse.json({
      id: user.id,
      username: user.username,
      name: user.name,
      nameMarathi: user.nameMarathi,
      role: user.role,
      sessionId: session.id,
    });

    response.cookies.set('session_user_id', user.id, COOKIE_OPTS);
    response.cookies.set('session_user_role', user.role, COOKIE_OPTS);
    response.cookies.set('session_id', session.id, COOKIE_OPTS);

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
