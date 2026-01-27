# AI Assistant Context Guide

This document provides comprehensive context for AI assistants working on the Screenshot Validation App project.

## Project Overview

**Purpose**: Automated webpage screenshot validation and monitoring tool for developers to capture, compare, and monitor screenshots of application status endpoints and health check pages.

**Tech Stack**:
- **Backend**: Python 3.11+ with FastAPI (async), [poiu], SQLAlchemy, SQLite
- **Frontend**: React 18 with TypeScript, Vite, Tailwind CSS, React Query
- **Browser Automation**: Playwright (Chromium)
- **Database**: SQLite with SQLAlchemy ORM

## Project Structure

```
validation-app/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes.py          # FastAPI endpoints
│   │   │   └── schemas.py         # Pydantic request/response models
│   │   ├── database/
│   │   │   ├── models.py          # SQLAlchemy models
│   │   │   └── database.py        # Database connection & session management
│   │   ├── services/
│   │   │   ├── screenshot_service.py    # Playwright screenshot logic
│   │   │   └── metadata_service.py       # Database CRUD operations
│   │   ├── config.py              # Application settings (Pydantic)
│   │   └── main.py                # FastAPI app initialization
│   ├── requirements.txt
│   └── run.py                     # Application entry point
├── frontend/
│   ├── src/
│   │   ├── components/            # Reusable React components
│   │   ├── pages/                 # Page components (Dashboard, Capture, History, Viewer)
│   │   ├── services/              # API service layer (axios)
│   │   └── App.tsx                # Main app with routing
│   └── package.json
└── README.md
```

## Architecture Patterns

### Backend Architecture

1. **Service Layer Pattern**: Business logic separated from API routes
   - `ScreenshotService`: Handles Playwright browser automation
   - `MetadataService`: Handles database operations
   - Routes delegate to services, services handle business logic

2. **Dependency Injection**: FastAPI's `Depends()` for database sessions
   - `db_manager.get_db()` provides database sessions
   - Services receive sessions as constructor parameters

3. **Repository Pattern**: `MetadataService` acts as repository for screenshot data

4. **Singleton Pattern**: Global instances for `screenshot_service` and `db_manager`

### Frontend Architecture

1. **Component-Based**: React functional components with hooks
2. **Service Layer**: `apiService` abstracts API calls
3. **State Management**: React Query for server state, useState for local state
4. **Routing**: React Router for navigation

## Key Components

### Backend Components

#### `ScreenshotService` (`backend/app/services/screenshot_service.py`)
- **Purpose**: Captures screenshots using Playwright
- **Key Methods**:
  - `initialize()`: Starts Playwright browser (called on app startup)
  - `capture_screenshot()`: Main screenshot capture logic
  - `close()`: Cleanup browser on shutdown
- **Important**: Browser is initialized once on startup, reused for all requests
- **Error Handling**: Returns `ScreenshotResult` with success/error status

#### `MetadataService` (`backend/app/services/metadata_service.py`)
- **Purpose**: Database operations for screenshot metadata
- **Key Methods**:
  - `save_screenshot_metadata()`: Save screenshot result to DB
  - `get_screenshots()`: Query with filters (URL, success, date range)
  - `get_statistics()`: Aggregate stats (total, successful, failed, success_rate)
- **Note**: Uses SQLAlchemy ORM, receives Session from FastAPI dependency

#### Database Models (`backend/app/database/models.py`)
- **ScreenshotMetadata**: Main model storing:
  - URL, timestamp, viewport dimensions
  - File path, base64_data (for frontend display)
  - HTTP status, load time, error messages
  - Success/failure status

#### API Routes (`backend/app/api/routes.py`)
- **Endpoints**:
  - `POST /api/v1/screenshot`: Single screenshot capture
  - `POST /api/v1/screenshot/batch`: Batch capture (up to 100 URLs)
  - `GET /api/v1/screenshots`: List with filters
  - `GET /api/v1/screenshots/{id}`: Get by ID
  - `GET /api/v1/statistics`: Get aggregate statistics
  - `DELETE /api/v1/screenshots/{id}`: Delete screenshot

### Frontend Components

#### `CaptureForm` (`frontend/src/components/CaptureForm.tsx`)
- Single URL capture form
- Auto-adds `https://` if protocol missing
- Configurable options: viewport, wait strategy, delays, timeouts

#### `BatchCaptureForm` (`frontend/src/components/BatchCaptureForm.tsx`)
- Multiple URLs (one per line, max 100)
- Shared options for all URLs

#### `Dashboard` (`frontend/src/pages/Dashboard.tsx`)
- Statistics cards (total, successful, failed, success rate)
- Grid of recent screenshots (12 most recent)

#### `History` (`frontend/src/pages/History.tsx`)
- Filterable list (by URL, success status)
- Pagination support

#### `ScreenshotViewer` (`frontend/src/pages/ScreenshotViewer.tsx`)
- Full-size screenshot display
- Side-by-side comparison with previous captures
- Download and delete functionality

## Important Patterns & Conventions

### Code Organization Rules (from user rules)

1. **File Length**: Never exceed 1050 lines. Split if approaching 1000 lines.
2. **OOP First**: Every functionality in dedicated class/struct/protocol
3. **Single Responsibility**: Each file/class/function does one thing only
4. **Modular Design**: Code should be reusable, testable, isolated
5. **Manager/Coordinator Patterns**:
   - UI logic → ViewModel (React components)
   - Business logic → Manager (Services)
   - Navigation/state flow → Coordinator (React Router)
6. **Function/Class Size**: Functions < 30-40 lines, classes < 200 lines
7. **Naming**: Descriptive, intention-revealing names (avoid: data, info, helper, temp)

### Database Session Handling

**CRITICAL**: `get_db()` must be a generator function, not return a context manager:
```python
def get_db(self) -> Generator[Session, None, None]:
    session = self.SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
```

### Screenshot Service Lifecycle

1. **Startup**: `lifespan()` in `main.py` calls `screenshot_service.initialize()`
2. **Runtime**: Browser instance reused for all requests
3. **Shutdown**: `lifespan()` calls `screenshot_service.close()`

### Error Handling

- **Backend**: Returns `ScreenshotResult` with `success=False` and `error_message`
- **Frontend**: React Query mutations handle errors, show toast notifications
- **Global Exception Handler**: Catches unhandled exceptions, returns 500 with details

## Configuration

### Backend Config (`backend/app/config.py`)
- **Database**: `sqlite:///./screenshots.db`
- **Screenshots Dir**: `./screenshots` (created automatically)
- **Playwright**: Headless mode, 30s timeout default
- **CORS**: Allows `http://localhost:3000` and `http://localhost:5173`
- **API**: Runs on `0.0.0.0:8000`

### Frontend Config (`frontend/vite.config.ts`)
- **Dev Server**: Port 3000
- **Proxy**: `/api` → `http://localhost:8000` (avoids CORS in dev)
- **API URL**: Uses proxy in dev (`/api/v1`), direct URL in production

## Common Workflows

### Capturing a Screenshot

1. User enters URL in `CaptureForm`
2. Form auto-adds `https://` if missing protocol
3. Frontend calls `POST /api/v1/screenshot` via `apiService`
4. Backend route creates `ScreenshotOptions` from request
5. `ScreenshotService.capture_screenshot()`:
   - Creates new browser context/page
   - Navigates to URL
   - Waits based on strategy (networkidle, DOM ready, etc.)
   - Takes screenshot, saves to file
   - Encodes as base64
   - Returns `ScreenshotResult`
6. `MetadataService` saves result to database
7. Frontend receives response, navigates to viewer page

### Viewing Screenshots

1. Dashboard/History queries `GET /api/v1/screenshots`
2. Displays thumbnails from `base64_data`
3. Clicking opens `ScreenshotViewer` with full details
4. Viewer can compare with previous captures of same URL

## Known Issues & Gotchas

### Python Version Compatibility
- **Issue**: Python 3.14 has compatibility issues with `greenlet` and `pydantic-core`
- **Solution**: Use Python 3.11 or 3.12
- **File**: `requirements-py311.txt` for compatible versions

### Playwright Browser Installation
- **Issue**: Chromium must be installed: `playwright install chromium`
- **Error**: "Failed to initialize Playwright browser"
- **Solution**: Run installation command in backend venv

### Database Session
- **Issue**: `get_db()` must be generator, not context manager
- **Error**: "'_GeneratorContextManager' object has no attribute 'add'"
- **Solution**: Use `yield` directly in `get_db()`, don't return context manager

### CORS & Network Errors
- **Issue**: Frontend calling backend directly can cause CORS issues
- **Solution**: Use Vite proxy in development (`/api/v1` instead of `http://localhost:8000/api/v1`)
- **Config**: `frontend/src/services/api.ts` uses proxy in dev mode

### URL Validation
- **Issue**: Browser `type="url"` validation too strict
- **Solution**: Use `type="text"` and auto-add `https://` if missing
- **Location**: `CaptureForm.tsx` handles URL normalization

### Frontend Dependencies
- **Issue**: `react-image-annotate` incompatible with React 18
- **Solution**: Removed from package.json
- **Issue**: `canvas` package requires native dependencies
- **Solution**: Install with `brew install pkg-config cairo pango libpng jpeg giflib librsvg`

## API Endpoints Reference

### Screenshot Capture
```http
POST /api/v1/screenshot
Content-Type: application/json

{
  "url": "https://example.com",
  "options": {
    "full_page": false,
    "viewport_width": 1920,
    "viewport_height": 1080,
    "wait_strategy": "networkidle",
    "wait_selector": null,
    "delay_ms": 0,
    "timeout_ms": 30000
  }
}
```

### Batch Capture
```http
POST /api/v1/screenshot/batch
Content-Type: application/json

{
  "urls": ["https://example.com", "https://example.org"],
  "options": { ... }
}
```

### List Screenshots
```http
GET /api/v1/screenshots?limit=100&offset=0&url=example&success=true
```

### Get Statistics
```http
GET /api/v1/statistics

Response: {
  "total": 100,
  "successful": 95,
  "failed": 5,
  "success_rate": 95.0
}
```

## Database Schema

```sql
CREATE TABLE screenshots (
    id INTEGER PRIMARY KEY,
    url TEXT NOT NULL,
    timestamp DATETIME NOT NULL,
    viewport_width INTEGER NOT NULL,
    viewport_height INTEGER NOT NULL,
    file_path TEXT,
    base64_data TEXT,              -- For frontend display
    http_status_code INTEGER,
    page_load_time_ms REAL,
    full_page BOOLEAN DEFAULT 0,
    wait_strategy TEXT,
    error_message TEXT,
    success BOOLEAN DEFAULT 1
);
```

## Development Workflow

### Starting the Application

1. **Backend**:
   ```bash
   cd backend
   python3.12 -m venv venv  # Use Python 3.11 or 3.12
   source venv/bin/activate
   pip install -r requirements.txt
   playwright install chromium
   python run.py
   ```

2. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Access**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Making Changes

1. **Backend Changes**: Restart `python run.py` (auto-reload in debug mode)
2. **Frontend Changes**: Vite HMR automatically reloads
3. **Database Changes**: Modify models, restart backend (tables auto-created)

### Debugging

- **Backend Logs**: Check terminal where `run.py` is running
- **Frontend Logs**: Browser console (F12)
- **Network**: Browser DevTools Network tab
- **API Testing**: Use http://localhost:8000/docs (Swagger UI)

## Testing Screenshot Capture

### Test URLs
- `https://example.com` - Simple test
- `https://httpbin.org/status/200` - HTTP status testing
- `https://httpbin.org/delay/2` - Timeout testing

### Common Test Scenarios
1. **Valid URL**: Should capture successfully
2. **Invalid URL**: Should return error with message
3. **Timeout**: Increase timeout or use faster wait strategy
4. **Authentication**: Use auth_headers or basic_auth options
5. **Slow Loading**: Use delay_ms or change wait_strategy

## File Locations for Common Tasks

- **Add new API endpoint**: `backend/app/api/routes.py`
- **Modify screenshot options**: `backend/app/services/screenshot_service.py`
- **Change database schema**: `backend/app/database/models.py`
- **Update frontend API calls**: `frontend/src/services/api.ts`
- **Add new page**: `frontend/src/pages/`
- **Add new component**: `frontend/src/components/`
- **Change configuration**: `backend/app/config.py` or `.env` file
- **Update CORS**: `backend/app/config.py` → `cors_origins`

## Important Notes for AI Assistants

1. **Always check file length** - Split if > 1000 lines
2. **Follow OOP patterns** - Use classes for functionality
3. **Single responsibility** - One thing per file/class/function
4. **Error handling** - Always handle exceptions, return meaningful errors
5. **Type hints** - Use TypeScript types and Python type hints
6. **Database sessions** - Always use dependency injection, never create sessions directly
7. **Playwright browser** - Reuse the global instance, don't create new browsers per request
8. **URL normalization** - Always ensure URLs have protocol (https://)
9. **CORS** - Use proxy in development, direct URL in production
10. **Python version** - Recommend Python 3.11 or 3.12, not 3.14

## Quick Reference

### Backend Imports
```python
from app.config import settings
from app.database.database import db_manager
from app.services.screenshot_service import ScreenshotService, ScreenshotOptions, screenshot_service
from app.services.metadata_service import MetadataService
from app.database.models import ScreenshotMetadata
```

### Frontend Imports
```typescript
import { apiService, ScreenshotOptions } from '../services/api'
import { useQuery, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
```

### Common Patterns
- **API Route**: Use `Depends(db_manager.get_db)` for database session
- **Service Method**: Receive `Session` in constructor, use `self.db`
- **React Component**: Use hooks (`useState`, `useQuery`, `useMutation`)
- **Error Display**: Use `toast.error()` for user notifications

## Environment Variables

### Backend (.env)
```
DEBUG=false
DATABASE_URL=sqlite:///./screenshots.db
SCREENSHOTS_DIR=./screenshots
API_HOST=0.0.0.0
API_PORT=8000
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:8000/api/v1
```

## Troubleshooting Quick Reference

| Error | Cause | Solution |
|-------|-------|----------|
| "Network error" | Backend not running or CORS | Check backend, use proxy |
| "500 Internal Server Error" | Backend exception | Check backend logs |
| "Failed to initialize Playwright" | Chromium not installed | `playwright install chromium` |
| "Please Enter a URL" | Browser validation | Use text input, auto-add https:// |
| Database errors | Session issue | Check `get_db()` is generator |
| Python 3.14 errors | Compatibility | Use Python 3.11 or 3.12 |

---

**Last Updated**: Based on current codebase state
**Maintainer Notes**: Keep this file updated when making significant architectural changes

