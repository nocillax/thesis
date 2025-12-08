#!/bin/bash

set -e  # Exit on any error

echo "🚀 Setting up Control System Database..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Load env vars from backend/.env if it exists, otherwise use defaults
if [ -f backend/.env ]; then
    export $(grep -v '^#' backend/.env | xargs)
    echo "✅ Loaded configuration from backend/.env"
else
    export DB_USERNAME=nocillax
    export DB_PASSWORD=2272
    export DB_NAME=cert_control_db
    echo "⚠️  Using default configuration"
fi

# Stop existing container if running
if [ "$(docker ps -q -f name=control-postgres)" ]; then
    echo "🔄 Stopping existing database container..."
    docker-compose down
fi

# Start PostgreSQL container
echo "🐘 Starting PostgreSQL container..."
docker-compose up -d

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for database to be ready..."
MAX_TRIES=30
COUNT=0
until docker exec control-postgres pg_isready -U $DB_USERNAME -d postgres > /dev/null 2>&1; do
  COUNT=$((COUNT+1))
  if [ $COUNT -ge $MAX_TRIES ]; then
    echo "❌ Database failed to start after ${MAX_TRIES} seconds"
    docker-compose logs
    exit 1
  fi
  sleep 1
  echo -n "."
done
echo ""
echo "✅ PostgreSQL is ready!"

# Create database if it doesn't exist
echo "📊 Creating database '$DB_NAME'..."
docker exec control-postgres psql -U $DB_USERNAME -d postgres -c "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
docker exec control-postgres psql -U $DB_USERNAME -d postgres -c "CREATE DATABASE $DB_NAME"

echo "✅ Database created!"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Database Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Database Configuration:"
echo "   Host: localhost"
echo "   Port: 5432"
echo "   Database: $DB_NAME"
echo "   Username: $DB_USERNAME"
echo "   Password: $DB_PASSWORD"
echo ""
echo "📝 Update backend/.env with these values:"
echo "   DB_HOST=localhost"
echo "   DB_PORT=5432"
echo "   DB_USERNAME=$DB_USERNAME"
echo "   DB_PASSWORD=$DB_PASSWORD"
echo "   DB_NAME=$DB_NAME"
echo ""
echo "📝 Admin Credentials (after first backend start):"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "🚀 Next Steps:"
echo "   1. cd backend"
echo "   2. npm install"
echo "   3. npm run start:dev"
echo ""
echo "   (Tables and admin user will be created on first backend start)"
echo ""
echo "💡 Database Management:"
echo "   ./stop-db.sh      - Stop database (keeps data)"
echo "   ./remove-db.sh    - Remove database (deletes all data)"
echo ""

