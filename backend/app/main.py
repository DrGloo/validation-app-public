"""FastAPI application main entry point."""
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from app.config import settings
from app.database.database import db_manager
from app.api.routes import router
from app.services.screenshot_service import screenshot_service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    try:
        logger.info("Creating database tables...")
        db_manager.create_tables()
        logger.info("Initializing Playwright browser...")
        await screenshot_service.initialize()
        logger.info("Backend startup complete")
    except Exception as e:
        logger.error(f"Startup error: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise
    yield
    # Shutdown
    try:
        logger.info("Shutting down...")
        await screenshot_service.close()
    except Exception as e:
        logger.error(f"Shutdown error: {e}")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(router)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle all unhandled exceptions."""
    import traceback
    error_details = traceback.format_exc()
    logger.error(f"Unhandled exception: {error_details}")
    return JSONResponse(
        status_code=500,
        content={
            "detail": f"Internal server error: {str(exc)}",
            "type": type(exc).__name__
        }
    )


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Screenshot Validation API",
        "version": settings.app_version,
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}

