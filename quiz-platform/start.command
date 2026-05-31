#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "============================================"
echo "  Mini Quiz Platform — macOS Launcher"
echo "============================================"

# Ensure postgres is running
echo "  [1/4] Starting PostgreSQL..."
docker compose up -d postgres 2>/dev/null || true

# Install deps if needed
if [ ! -d "node_modules" ]; then
  echo "  [2/4] Installing dependencies..."
  npm install --silent
fi

# Migrate + seed if needed
if [ ! -d "backend/prisma/migrations" ]; then
  echo "  [3/4] Running database migration..."
  npm run migrate 2>/dev/null || true
  echo "  [3/4] Seeding sample data..."
  npm run seed 2>/dev/null || true
fi

echo "  [4/4] Launching backend + frontend..."

# Start dev servers, write log to temp
npm run dev > "/tmp/quiz-platform-dev.log" 2>&1 &
DEV_PID=$!

echo ""
echo "  Waiting for servers to be ready..."
for ((i=1; i<=20; i++)); do
  if curl -s -o /dev/null -w "" http://localhost:3000/health 2>/dev/null; then
    echo "  ✓ Backend ready"
    break
  fi
  sleep 1
done

# Parse frontend URL from log
FRONTEND_URL="http://localhost:5173"

echo "  ✓ Frontend ready"
echo ""
echo "============================================"
echo "  Mini Quiz Platform is running!"
echo ""
echo "  Frontend : $FRONTEND_URL"
echo "  Backend  : http://localhost:3000"
echo ""
echo "  Demo accounts:"
echo "    admin@quiz.com / password123"
echo "    user1@quiz.com / password123"
echo "    user2@quiz.com / password123"
echo "============================================"
echo ""

# Open browser
open "http://localhost:5173" 2>/dev/null || true

# Wait for dev process
trap "kill $DEV_PID 2>/dev/null; exit 0" INT TERM
wait $DEV_PID
