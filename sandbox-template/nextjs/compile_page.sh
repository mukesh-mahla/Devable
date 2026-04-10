#!/bin/bash

set -e

cd /home/user

echo "Installing dependencies..."
npm install --legacy-peer-deps

echo "Starting Next.js dev server..."

# ✅ Correct command (no --no-turbo)
WATCHPACK_POLLING=true NEXT_DISABLE_ORIGIN_CHECK=1 npx next dev -p 3000 -H 0.0.0.0 > /tmp/next.log 2>&1 &

# Wait until server is ready
echo "Waiting for server to start..."
until curl -s http://localhost:3000 > /dev/null; do
  sleep 0.2
done

echo "Server is ready!"