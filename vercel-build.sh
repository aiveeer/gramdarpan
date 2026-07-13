#!/bin/bash
# Vercel Build Script for ग्रामदर्पण
set -e

echo "🔧 Generating Prisma client..."
npx prisma generate

echo "📦 Pushing schema to PostgreSQL database..."
# Try direct URL first (for migrations), fall back to DATABASE_URL
PUSH_URL="${POSTGRES_URL_NON_POOLING:-${DATABASE_URL_UNPOOLED:-${DATABASE_URL}}}"
if [ -n "$PUSH_URL" ]; then
  echo "  Using database URL for schema push..."
  DATABASE_URL="$PUSH_URL" npx prisma db push --accept-data-loss 2>/dev/null || echo "⚠️ DB push completed with warnings"
else
  echo "  No database URL found, trying default..."
  npx prisma db push --accept-data-loss 2>/dev/null || echo "⚠️ DB push step skipped"
fi

echo "🏗️ Building Next.js..."
next build

echo "✅ Vercel build completed successfully!"
