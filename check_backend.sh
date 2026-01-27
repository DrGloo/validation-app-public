#!/bin/bash
# Script to check if backend is running and accessible

echo "Checking backend status..."
echo ""

# Check if port 8000 is in use
if lsof -ti:8000 > /dev/null 2>&1; then
    echo "✅ Port 8000 is in use"
    PID=$(lsof -ti:8000)
    echo "   Process ID: $PID"
else
    echo "❌ Port 8000 is not in use"
    echo "   Backend server is not running"
    exit 1
fi

# Check if backend responds to health check
echo ""
echo "Testing backend health endpoint..."
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Backend is responding"
    curl -s http://localhost:8000/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:8000/health
else
    echo "❌ Backend is not responding"
    echo "   The server might be starting up or there's an error"
    echo ""
    echo "Check backend logs for errors"
    exit 1
fi

# Check API endpoint
echo ""
echo "Testing API endpoint..."
if curl -s http://localhost:8000/api/v1/statistics > /dev/null 2>&1; then
    echo "✅ API endpoint is accessible"
else
    echo "⚠️  API endpoint test failed (this might be normal if no screenshots exist)"
fi

echo ""
echo "Backend status check complete!"

