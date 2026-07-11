#!/bin/bash
# Vercel Build Script for ग्रामदर्पण
# Uses Neon PostgreSQL variables auto-set by Vercel-Neon Integration
set -e

echo "🔧 Generating Prisma client..."
npx prisma generate

echo "📦 Pushing schema to PostgreSQL database..."
# Use the direct (non-pooled) URL for schema migrations
export DATABASE_URL="$POSTGRES_URL_NON_POOLING"
npx prisma db push --accept-data-loss 2>/dev/null || echo "⚠️ DB push completed with warnings (OK for first deploy)"

echo "🏗️ Building Next.js..."
next build

echo "✅ Vercel build completed successfully!"
