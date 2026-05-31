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
BACKEND_URL=""
FRONTEND_URL=""
for ((i=1; i<=50; i++)); do
  if [ -z "$BACKEND_URL" ] && grep -q "Backend URL:" /tmp/quiz-platform-dev.log 2>/dev/null; then
    BACKEND_URL=$(grep "Backend URL:" /tmp/quiz-platform-dev.log | tail -1 | sed 's/.*http/http/')
    echo "  ✓ Backend ready at $BACKEND_URL"
  fi
  if [ -z "$FRONTEND_URL" ] && grep -q "Frontend URL:" /tmp/quiz-platform-dev.log 2>/dev/null; then
    FRONTEND_URL=$(grep "Frontend URL:" /tmp/quiz-platform-dev.log | tail -1 | sed 's/.*http/http/')
    echo "  ✓ Frontend ready at $FRONTEND_URL"
  fi
  if [ -n "$BACKEND_URL" ] && [ -n "$FRONTEND_URL" ]; then
    break
  fi
  sleep 1
done

if [ -z "$BACKEND_URL" ]; then
  BACKEND_URL="http://localhost:3000"
fi
if [ -z "$FRONTEND_URL" ]; then
  FRONTEND_URL="http://localhost:5173"
fi

echo ""
echo "============================================"
echo "  Mini Quiz Platform is running!"
echo ""
echo "  Frontend : $FRONTEND_URL"
echo "  Backend  : $BACKEND_URL"
echo ""
echo "  Demo accounts:"
echo "    admin@quiz.com / password123"
echo "    user1@quiz.com / password123"
echo "    user2@quiz.com / password123"
echo "============================================"
echo ""

# Open browser
open "$FRONTEND_URL" 2>/dev/null || true

# Wait for dev process
trap "kill $DEV_PID 2>/dev/null; exit 0" INT TERM
wait $DEV_PID
