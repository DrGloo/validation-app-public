#!/bin/bash
# Quick fix script to use Python 3.12 instead of 3.14

cd "$(dirname "$0")/backend"

echo "🔧 Fixing Python version compatibility issue..."
echo ""

# Check if Python 3.12 is available
if command -v python3.12 &> /dev/null; then
    echo "✅ Python 3.12 found!"
    PYTHON_CMD="python3.12"
elif command -v python3.11 &> /dev/null; then
    echo "✅ Python 3.11 found!"
    PYTHON_CMD="python3.11"
else
    echo "❌ Python 3.11 or 3.12 not found."
    echo ""
    echo "Installing Python 3.12 with Homebrew..."
    brew install python@3.12
    PYTHON_CMD="python3.12"
fi

echo "Using: $PYTHON_CMD"
echo ""

# Remove old venv
if [ -d "venv" ]; then
    echo "Removing old virtual environment..."
    rm -rf venv
fi

# Create new venv with compatible Python
echo "Creating new virtual environment with $PYTHON_CMD..."
$PYTHON_CMD -m venv venv

# Activate and install
echo "Installing dependencies..."
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Install Playwright
echo "Installing Playwright browsers..."
playwright install chromium

echo ""
echo "✅ Setup complete! You can now start the server with:"
echo "   cd backend && source venv/bin/activate && python run.py"

