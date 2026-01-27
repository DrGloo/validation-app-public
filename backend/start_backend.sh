#!/bin/bash
# Startup script for the backend server

cd "$(dirname "$0")/backend"

# Check Python version
PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
echo "Detected Python version: $PYTHON_VERSION"

# Check if Python 3.14+ (too new, may have compatibility issues)
if python3 -c "import sys; exit(0 if sys.version_info >= (3, 14) else 1)" 2>/dev/null; then
    echo "⚠️  WARNING: Python 3.14+ detected!"
    echo "Some packages (greenlet, pydantic-core) may not be compatible."
    echo "Consider using Python 3.11 or 3.12 for better compatibility."
    echo ""
    echo "To use Python 3.12 instead:"
    echo "  brew install python@3.12"
    echo "  python3.12 -m venv venv"
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check if venv exists, if not create it
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate venv and install dependencies
echo "Installing Python dependencies..."
source venv/bin/activate
pip install --upgrade pip

# Try installing with updated requirements
echo "Installing packages..."
if ! pip install -r requirements.txt; then
    echo "⚠️  Installation failed with updated requirements."
    echo "Trying with Python 3.11-compatible versions..."
    pip install -r requirements-py311.txt || {
        echo "❌ Installation failed. Please use Python 3.11 or 3.12."
        echo "Install Python 3.12: brew install python@3.12"
        echo "Then recreate venv: rm -rf venv && python3.12 -m venv venv"
        exit 1
    }
fi

# Install Playwright browsers
echo "Installing Playwright browsers..."
playwright install chromium

# Start the server
echo "Starting backend server on http://localhost:8000"
python run.py

