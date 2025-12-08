#!/bin/bash

read -p "⚠️  Delete all data? Type 'yes': " -r
echo ""

if [[ $REPLY == "yes" ]]; then
  docker-compose down -v
  echo "✅ Database removed"
else
  echo "Cancelled"
fi
