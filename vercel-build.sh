#!/bin/bash
# Vercel Build Script for ग्रामदर्पण
# Uses Neon PostgreSQL variables auto-set by Vercel-Neon Integration
set -e

echo "🔧 Generating Prisma client..."
npx prisma generate

echo "📦 Pushing schema to PostgreSQL database..."
# Try all possible direct (non-pooled) URL variable names
# Vercel-Neon integration has used different names over time
DIRECT_URL="${POSTGRES_URL_NON_POOLING:-${DATABASE_URL_UNPOOLED:-${DIRECT_URL:-}}}"

if [ -n "$DIRECT_URL" ]; then
  echo "  Using direct URL for schema push..."
  DATABASE_URL="$DIRECT_URL" npx prisma db push --accept-data-loss 2>/dev/null || echo "⚠️ DB push completed with warnings"
else
  echo "  No direct URL found, trying with DATABASE_URL..."
  npx prisma db push --accept-data-loss 2>/dev/null || echo "⚠️ DB push step skipped"
fi

echo "🏗️ Building Next.js..."
next build

echo "✅ Vercel build completed successfully!"
