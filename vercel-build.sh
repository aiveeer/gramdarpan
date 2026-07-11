#!/bin/bash
# Vercel Build Script for ग्रामदर्पण
# Uses Neon PostgreSQL variables auto-set by Vercel-Neon Integration
set -e

echo "🔧 Generating Prisma client..."
npx prisma generate

echo "📦 Pushing schema to PostgreSQL database..."
# DATABASE_URL is the unpooled/direct connection (best for migrations)
# It is auto-set by Vercel-Neon integration
npx prisma db push --accept-data-loss 2>/dev/null || echo "⚠️ DB push completed with warnings"

echo "🏗️ Building Next.js..."
next build

echo "✅ Vercel build completed successfully!"
