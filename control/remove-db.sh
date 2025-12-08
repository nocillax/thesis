#!/bin/bash

echo "⚠️  WARNING: This will delete ALL database data!"
echo ""
read -p "Are you sure? Type 'yes' to confirm: " -r
echo ""

if [[ $REPLY == "yes" ]]; then
  docker-compose down -v
  echo "✅ Database removed (all data deleted)"
  echo ""
  echo "💡 To set up again: ./setup-db.sh"
else
  echo "❌ Cancelled"
fi
