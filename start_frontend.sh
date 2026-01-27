#!/bin/bash
# Startup script for the frontend server

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

# Check if frontend directory exists
if [ ! -d "$FRONTEND_DIR" ]; then
    echo "Error: Frontend directory not found at $FRONTEND_DIR"
    exit 1
fi

# Change to frontend directory
cd "$FRONTEND_DIR" || {
    echo "Error: Failed to change to frontend directory"
    exit 1
}

# Verify we're in the right place
if [ ! -f "package.json" ]; then
    echo "Error: package.json not found. Current directory: $(pwd)"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing npm dependencies..."
    echo "This may take a few minutes..."
    if ! npm install; then
        echo ""
        echo "❌ npm install failed. This might be due to permissions."
        echo "Try running manually:"
        echo "  cd $FRONTEND_DIR"
        echo "  npm install"
        echo ""
        exit 1
    fi
    echo "✅ Dependencies installed successfully"
fi

# Start the dev server
echo "Starting frontend server on http://localhost:3000"
npm run dev

