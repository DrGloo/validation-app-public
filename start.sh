#!/bin/bash
# Startup script to run both backend and frontend

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Start backend in background
echo "Starting backend..."
cd "$SCRIPT_DIR/backend"
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install --upgrade pip -q
pip install -r requirements.txt -q
playwright install chromium -q
python run.py &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 3

# Start frontend
echo "Starting frontend..."
cd "$SCRIPT_DIR/frontend" || {
    echo "Error: Failed to change to frontend directory"
    exit 1
}

# Verify package.json exists
if [ ! -f "package.json" ]; then
    echo "Error: package.json not found in frontend directory"
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo "Installing npm dependencies..."
    npm install
fi

npm run dev &
FRONTEND_PID=$!

echo ""
echo "========================================="
echo "Application started!"
echo "Backend:  http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo "API Docs: http://localhost:8000/docs"
echo "========================================="
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user interrupt
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait

