#!/bin/bash

set -e  # Exit on any error

echo "🚀 Setting up Control System Database..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Load env vars from backend/.env if it exists
if [ -f backend/.env ]; then
    export $(grep -v '^#' backend/.env | xargs)
    echo "✅ Loaded configuration from backend/.env"
else
    # Use defaults
    export DB_USERNAME=nocillax
    export DB_PASSWORD=2272
    export DB_NAME=cert_control_db
    echo "⚠️  Using default configuration (backend/.env not found)"
fi

# Stop existing container if running
if [ "$(docker ps -q -f name=control-postgres)" ]; then
    echo "🔄 Stopping existing database container..."
    docker-compose down
fi

# Start PostgreSQL container
echo "🐘 Starting PostgreSQL container..."
docker-compose up -d

# Wait for healthy status
echo "⏳ Waiting for database to be ready..."
MAX_TRIES=30
COUNT=0
until docker-compose exec -T postgres pg_isready -U $DB_USERNAME > /dev/null 2>&1; do
  COUNT=$((COUNT+1))
  if [ $COUNT -ge $MAX_TRIES ]; then
    echo "❌ Database failed to start after ${MAX_TRIES} seconds"
    exit 1
  fi
  sleep 1
  echo -n "."
done
echo ""

echo "✅ Database is ready!"
echo ""
echo "📊 Database Details:"
echo "   Host: localhost"
echo "   Port: 5432"
echo "   Database: $DB_NAME"
echo "   Username: $DB_USERNAME"
echo ""

# Install backend dependencies and seed admin
echo "📦 Installing backend dependencies..."
cd backend
npm install --silent

echo "🌱 Starting backend to seed admin user..."
echo "   (This will create tables and seed admin: admin / admin123)"
echo ""

# Start backend in background, wait for seeding, then stop
npm run start:dev &
BACKEND_PID=$!

# Wait for admin seeding message or timeout
echo "⏳ Waiting for admin user to be created..."
TIMEOUT=30
COUNT=0
while [ $COUNT -lt $TIMEOUT ]; do
    if docker-compose exec -T postgres psql -U $DB_USERNAME -d $DB_NAME -c "SELECT COUNT(*) FROM users WHERE username='admin'" 2>/dev/null | grep -q "1"; then
        echo "✅ Admin user created successfully!"
        break
    fi
    COUNT=$((COUNT+1))
    sleep 1
done

# Kill backend process
kill $BACKEND_PID 2>/dev/null || true
wait $BACKEND_PID 2>/dev/null || true

cd ..

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Default Admin Credentials:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "🚀 Next Steps:"
echo "   cd backend"
echo "   npm run start:dev"
echo ""
echo "🔗 API will be available at: http://localhost:8000"
echo ""
echo "💡 Useful Commands:"
echo "   ./stop-db.sh      - Stop database (keeps data)"
echo "   ./remove-db.sh    - Remove database (deletes all data)"
echo "   ./setup-db.sh     - Run setup again"
echo ""
