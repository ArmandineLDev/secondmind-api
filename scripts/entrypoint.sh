#!/bin/sh
set -e

if [ -n "$SQITCH_TARGET" ]; then
  echo "Running database migrations..."
  sqitch deploy "$SQITCH_TARGET"
  echo "Migrations complete."
fi

exec node --import tsx/esm src/server.ts
