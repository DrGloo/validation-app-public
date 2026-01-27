# Quick Start Guide

Due to system permissions, please run these commands manually in your terminal.

## Option 1: Start Both Servers (Recommended)

Open two terminal windows and run:

### Terminal 1 - Backend:
```bash
cd /Users/rai/Documents/GitHub/validation-app/backend

# Create virtual environment (if not exists)
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Install Playwright browsers
playwright install chromium

# Start the server
python run.py
```

The backend will start on `http://localhost:8000`

### Terminal 2 - Frontend:
```bash
cd /Users/rai/Documents/GitHub/validation-app/frontend

# Install dependencies (first time only)
npm install

# Start the dev server
npm run dev
```

The frontend will start on `http://localhost:3000`

## Option 2: Use the Startup Scripts

Make the scripts executable and run them:

```bash
# Make scripts executable
chmod +x start_backend.sh start_frontend.sh start.sh

# Option A: Start both together
./start.sh

# Option B: Start separately
./start_backend.sh    # In one terminal
./start_frontend.sh    # In another terminal
```

## Verify Installation

1. **Backend API**: Visit http://localhost:8000/docs for API documentation
2. **Frontend**: Visit http://localhost:3000 for the web interface
3. **Health Check**: Visit http://localhost:8000/health

## Troubleshooting

### Python Virtual Environment Issues
If you get permission errors with venv:
```bash
# Try using a different location for venv
python3 -m venv ~/.venvs/validation-app
source ~/.venvs/validation-app/bin/activate
cd /Users/rai/Documents/GitHub/validation-app/backend
pip install -r requirements.txt
```

### Playwright Browser Not Found
```bash
cd backend
source venv/bin/activate
playwright install chromium
```

### Port Already in Use
- Backend: Change port in `backend/app/config.py` or set `API_PORT` environment variable
- Frontend: Vite will automatically try the next available port

### npm Install Issues
```bash
# Clear npm cache
npm cache clean --force

# Try installing again
npm install
```

## First Time Setup Checklist

- [ ] Python 3.11+ installed
- [ ] Node.js 18+ installed
- [ ] Backend dependencies installed
- [ ] Playwright browsers installed
- [ ] Frontend dependencies installed
- [ ] Backend server running on port 8000
- [ ] Frontend server running on port 3000

## Access the Application

Once both servers are running:
- **Web Interface**: http://localhost:3000
- **API Documentation**: http://localhost:8000/docs
- **API Health Check**: http://localhost:8000/health

