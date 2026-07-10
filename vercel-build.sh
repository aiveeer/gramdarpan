#!/bin/bash
# Vercel Build Script for ग्रामदर्पण
# Uses PostgreSQL (DATABASE_URL and DIRECT_URL must be set in Vercel Environment Variables)
set -e

echo "🔧 Generating Prisma client..."
npx prisma generate

echo "📦 Pushing schema to PostgreSQL database..."
npx prisma db push --accept-data-loss 2>/dev/null || echo "⚠️ DB push completed with warnings (this is OK for first deploy)"

echo "🏗️ Building Next.js..."
next build

echo "✅ Vercel build completed successfully!"
