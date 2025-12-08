#!/bin/bash

echo "🛑 Stopping Control System Database..."
docker-compose stop
echo "✅ Database stopped (data preserved)"
echo ""
echo "💡 To start again: ./setup-db.sh"
