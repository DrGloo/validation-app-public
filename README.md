# Screenshot Validation App

A comprehensive web application for automated webpage screenshot validation and monitoring. Built with Python FastAPI backend and React TypeScript frontend, this tool helps developers capture, compare, and monitor screenshots of application status endpoints and health check pages.

## Features

### Backend (Python/FastAPI)
- ✅ REST API endpoints for single and batch screenshot capture
- ✅ Configurable screenshot options (viewport size, wait strategies, delays)
- ✅ SQLite database for storing screenshot metadata
- ✅ Playwright-based browser automation with Chromium
- ✅ Support for authentication headers and basic auth
- ✅ Error handling for timeouts, HTTP errors, and SSL issues
- ✅ Comprehensive metadata tracking (HTTP status, load time, viewport dimensions)

### Frontend (React/TypeScript)
- ✅ **Dashboard View**: Overview with statistics and recent screenshots
- ✅ **Capture Interface**: Single URL and batch processing with real-time progress
- ✅ **Screenshot Viewer**: Full-size viewing with side-by-side comparison
- ✅ **History & Reports**: Filterable timeline with export capabilities
- ✅ **Modern UI**: Tailwind CSS styling with responsive design
- ✅ **State Management**: React Query for efficient data fetching and caching

## Tech Stack

### Backend
- **Python 3.11+**
- **FastAPI** - Modern async web framework
- **Playwright** - Browser automation
- **SQLAlchemy** - ORM for database operations
- **SQLite** - Lightweight database
- **Pydantic** - Data validation

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Query** - Data fetching and state management
- **React Router** - Client-side routing

## Project Structure

```
validation-app/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes.py          # API endpoints
│   │   │   └── schemas.py         # Pydantic schemas
│   │   ├── database/
│   │   │   ├── models.py          # SQLAlchemy models
│   │   │   └── database.py        # Database manager
│   │   ├── services/
│   │   │   ├── screenshot_service.py    # Playwright screenshot logic
│   │   │   └── metadata_service.py      # Database operations
│   │   ├── config.py              # Application settings
│   │   └── main.py                # FastAPI app
│   ├── requirements.txt
│   └── run.py                     # Application entry point
├── frontend/
│   ├── src/
│   │   ├── components/            # React components
│   │   ├── pages/                 # Page components
│   │   ├── services/              # API service layer
│   │   └── App.tsx                # Main app component
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## Installation

### Prerequisites
- Python 3.11 or higher
- Node.js 18 or higher
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install Python dependencies:
```bash
pip install -r requirements.txt
```

4. Install Playwright browsers:
```bash
playwright install chromium
```

5. Create a `.env` file (optional) for custom configuration:
```env
DEBUG=false
DATABASE_URL=sqlite:///./screenshots.db
SCREENSHOTS_DIR=./screenshots
API_HOST=0.0.0.0
API_PORT=8000
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (optional) for API URL:
```env
VITE_API_URL=http://localhost:8000/api/v1
```

## Running the Application

### Start the Backend

From the `backend` directory:
```bash
python run.py
```

Or using uvicorn directly:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`
- API Documentation: `http://localhost:8000/docs`
- Alternative docs: `http://localhost:8000/redoc`

### Start the Frontend

From the `frontend` directory:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Usage

### Capturing Screenshots

#### Single URL Capture
1. Navigate to the **Capture** page
2. Enter the URL you want to capture
3. Configure options:
   - **Full Page**: Capture entire page or just viewport
   - **Viewport Size**: Choose preset (Desktop, Laptop, Tablet, Mobile) or custom
   - **Wait Strategy**: Network idle, DOM ready, load, commit, or selector
   - **Delay**: Wait time before capture (milliseconds)
   - **Timeout**: Maximum wait time (milliseconds)
4. Click **Capture Screenshot**

#### Batch Capture
1. Switch to **Batch URLs** tab
2. Enter multiple URLs (one per line)
3. Configure shared options for all URLs
4. Click **Capture Screenshots**

### Viewing Screenshots

- **Dashboard**: View recent screenshots and statistics
- **History**: Browse all captures with filtering options
- **Screenshot Viewer**: Click any screenshot to view details, compare with previous captures, and download

### Screenshot Options

#### Viewport Presets
- **Desktop**: 1920 × 1080
- **Laptop**: 1366 × 768
- **Tablet**: 768 × 1024
- **Mobile**: 375 × 667
- **Custom**: Set your own dimensions

#### Wait Strategies
- **networkidle**: Wait for network to be idle (default)
- **domcontentloaded**: Wait for DOM content loaded
- **load**: Wait for page load event
- **commit**: Wait for navigation commit
- **selector**: Wait for specific CSS selector to appear

## API Endpoints

### Screenshots
- `POST /api/v1/screenshot` - Capture single screenshot
- `POST /api/v1/screenshot/batch` - Capture multiple screenshots
- `GET /api/v1/screenshots` - List screenshots with filters
- `GET /api/v1/screenshots/{id}` - Get screenshot by ID
- `GET /api/v1/screenshots/url/{url}` - Get screenshots for URL
- `DELETE /api/v1/screenshots/{id}` - Delete screenshot

### Statistics
- `GET /api/v1/statistics` - Get capture statistics

### Health
- `GET /health` - Health check endpoint
- `GET /` - API information

## Configuration

### Backend Configuration

Edit `backend/app/config.py` or set environment variables:

- `DATABASE_URL`: SQLite database path
- `SCREENSHOTS_DIR`: Directory for storing screenshot files
- `PLAYWRIGHT_TIMEOUT`: Default timeout in milliseconds
- `PLAYWRIGHT_HEADLESS`: Run browser in headless mode
- `CORS_ORIGINS`: Allowed CORS origins

### Frontend Configuration

Edit `frontend/vite.config.ts` or set environment variables:

- `VITE_API_URL`: Backend API URL

## Database Schema

The application uses SQLite with the following schema:

```sql
CREATE TABLE screenshots (
    id INTEGER PRIMARY KEY,
    url TEXT NOT NULL,
    timestamp DATETIME NOT NULL,
    viewport_width INTEGER NOT NULL,
    viewport_height INTEGER NOT NULL,
    file_path TEXT,
    base64_data TEXT,
    http_status_code INTEGER,
    page_load_time_ms REAL,
    full_page BOOLEAN DEFAULT 0,
    wait_strategy TEXT,
    error_message TEXT,
    success BOOLEAN DEFAULT 1
);
```

## Development

### Backend Development

The backend uses FastAPI with automatic API documentation:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Frontend Development

The frontend uses Vite for fast HMR (Hot Module Replacement):
- Development server with auto-reload
- TypeScript type checking
- ESLint for code quality

### Code Structure

The project follows clean architecture principles:
- **Services**: Business logic separated from API routes
- **Models**: Database models with clear separation
- **Components**: Reusable React components
- **Single Responsibility**: Each file has one clear purpose

## Troubleshooting

### Playwright Browser Not Found
```bash
cd backend
playwright install chromium
```

### Port Already in Use
Change the port in `backend/app/config.py` or set `API_PORT` environment variable.

### CORS Errors
Ensure the frontend URL is in `CORS_ORIGINS` in `backend/app/config.py`.

### Database Issues
Delete `screenshots.db` to reset the database (all data will be lost).

## Future Enhancements

- [ ] Scheduled screenshot jobs with APScheduler
- [ ] Visual diff highlighting between captures
- [ ] PDF/HTML report export
- [ ] Screenshot annotation tools
- [ ] URL presets/collections management
- [ ] Email notifications for failed captures
- [ ] Webhook support for integrations
- [ ] Multi-user support with authentication

## License

MIT License - feel free to use this project for your own purposes.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
