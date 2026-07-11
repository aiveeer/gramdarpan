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
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24, // 24 hours
  path: '/',
};

// Auto-seed: ensure default user exists (critical for Vercel where DB starts empty)
async function ensureDefaultUser() {
  try {
    const count = await db.user.count();
    if (count === 0) {
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
      console.log('✅ Auto-seeded default users');
    }
  } catch (error) {
    console.error('Auto-seed error:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Always ensure at least the default user exists
    await ensureDefaultUser();

    const body = await request.json();

    // Seed endpoint (explicit)
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

    // Set cookies via NextResponse
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
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({
      error: 'Login failed - database connection error',
      details: errorMsg,
      hint: 'Visit /api/test-db to check database connection, then /api/setup to seed database',
    }, { status: 500 });
  }
}
