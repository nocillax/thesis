#!/bin/bash

set -e

echo "Setting up database..."

if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running"
    exit 1
fi

# Load .env if exists, otherwise use defaults
if [ -f backend/.env ]; then
    export $(grep -v '^#' backend/.env | xargs)
else
    export DB_USERNAME=nocillax
    export DB_PASSWORD=2272
    export DB_NAME=cert_control_db
fi

# Stop existing container
if [ "$(docker ps -q -f name=control-postgres)" ]; then
    docker-compose down
fi

# Start PostgreSQL
docker-compose up -d

# Wait for ready
MAX_TRIES=30
COUNT=0
until docker exec control-postgres pg_isready -U $DB_USERNAME -d postgres > /dev/null 2>&1; do
  COUNT=$((COUNT+1))
  if [ $COUNT -ge $MAX_TRIES ]; then
    echo "Error: Database failed to start"
    exit 1
  fi
  sleep 1
done

# Create database
docker exec control-postgres psql -U $DB_USERNAME -d postgres -c "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
docker exec control-postgres psql -U $DB_USERNAME -d postgres -c "CREATE DATABASE $DB_NAME"

echo "✅ Database ready"
echo ""
echo "Connection details:"
echo "  Host: localhost"
echo "  Port: 5433"
echo "  Database: $DB_NAME"
echo "  Username: $DB_USERNAME"
echo "  Password: $DB_PASSWORD"
echo ""
echo "Next: cd backend && npm install && npm run start:dev"
