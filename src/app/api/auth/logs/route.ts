import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const logs = await db.userSession.findMany({
      take: limit,
      orderBy: { loginAt: 'desc' },
      include: {
        user: {
          select: { username: true, name: true, nameMarathi: true, role: true },
        },
      },
    });

    const auditLogs = await db.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { username: true, name: true, nameMarathi: true, role: true },
        },
      },
    });

    return NextResponse.json({ sessions: logs, auditLogs });
  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}
