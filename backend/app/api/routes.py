"""FastAPI routes for screenshot API."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from app.database.database import db_manager
from app.api.schemas import (
    SingleScreenshotRequest,
    BatchScreenshotRequest,
    ScreenshotResponse,
    BatchScreenshotResponse,
    StatisticsResponse,
    ScreenshotListResponse,
    ApiKeyCreateRequest,
    ApiKeyCreateResponse,
    ApiKeyResponse,
    ApiKeyListResponse,
)
from app.services.screenshot_service import ScreenshotService, ScreenshotOptions, ScreenshotResult, screenshot_service
from app.services.metadata_service import MetadataService
from app.services.api_key_service import ApiKeyService
from app.api.dependencies import get_api_key
from app.database.models import ApiKey


router = APIRouter(prefix="/api/v1", tags=["screenshots"])


@router.get("")
async def api_root():
    """API root endpoint."""
    return {
        "message": "Screenshot Validation API",
        "version": "1.0.0",
        "endpoints": {
            "capture_single": "POST /api/v1/screenshot",
            "capture_batch": "POST /api/v1/screenshot/batch",
            "list_screenshots": "GET /api/v1/screenshots",
            "get_screenshot": "GET /api/v1/screenshots/{id}",
            "get_statistics": "GET /api/v1/statistics",
            "delete_screenshot": "DELETE /api/v1/screenshots/{id}",
        }
    }


@router.post("/screenshot", response_model=ScreenshotResponse)
async def capture_single_screenshot(
    request: SingleScreenshotRequest,
    db: Session = Depends(db_manager.get_db),
    api_key: Optional[ApiKey] = Depends(get_api_key)  # Optional authentication
):
    """Capture screenshot of a single URL."""
    try:
        options_dict = request.options.dict() if request.options else {}
        options = ScreenshotOptions(**options_dict)
        
        # Convert URL to string and ensure it has a protocol
        url_str = str(request.url)
        if not url_str.startswith(('http://', 'https://')):
            url_str = f'https://{url_str}'
        
        result = await screenshot_service.capture_screenshot(url_str, options)
        
        metadata_service = MetadataService(db)
        metadata = metadata_service.save_screenshot_metadata(result)
        
        return ScreenshotResponse(**metadata.to_dict())
    except ValueError as e:
        # Pydantic validation errors
        raise HTTPException(
            status_code=422,
            detail=f"Invalid URL format: {str(e)}"
        )
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Error capturing screenshot: {error_details}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to capture screenshot: {str(e)}"
        )


@router.post("/screenshot/batch", response_model=BatchScreenshotResponse)
async def capture_batch_screenshots(
    request: BatchScreenshotRequest,
    db: Session = Depends(db_manager.get_db),
    api_key: Optional[ApiKey] = Depends(get_api_key)  # Optional authentication
):
    """Capture screenshots for multiple URLs."""
    try:
        options_dict = request.options.dict() if request.options else {}
        options = ScreenshotOptions(**options_dict)
        
        results = []
        metadata_service = MetadataService(db)
        
        for url in request.urls:
            try:
                # Convert URL to string and ensure it has a protocol
                url_str = str(url)
                if not url_str.startswith(('http://', 'https://')):
                    url_str = f'https://{url_str}'
                
                result = await screenshot_service.capture_screenshot(url_str, options)
                metadata = metadata_service.save_screenshot_metadata(result)
                results.append(ScreenshotResponse(**metadata.to_dict()))
            except Exception as e:
                # If individual URL fails, create error result and continue
                import traceback
                error_details = traceback.format_exc()
                print(f"Error capturing screenshot for {url}: {error_details}")
                
                # Create a failed result for this URL
                failed_result = ScreenshotResult(
                    success=False,
                    url=str(url),
                    error_message=f"Failed to capture screenshot: {str(e)}",
                    viewport_width=options.viewport_width,
                    viewport_height=options.viewport_height,
                    full_page=options.full_page,
                    wait_strategy=options.wait_strategy,
                )
                metadata = metadata_service.save_screenshot_metadata(failed_result)
                results.append(ScreenshotResponse(**metadata.to_dict()))
        
        successful = sum(1 for r in results if r.success)
        failed = len(results) - successful
        
        return BatchScreenshotResponse(
            results=results,
            total=len(results),
            successful=successful,
            failed=failed
        )
    except ValueError as e:
        # Pydantic validation errors
        raise HTTPException(
            status_code=422,
            detail=f"Invalid request format: {str(e)}"
        )
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Error in batch screenshot capture: {error_details}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to capture batch screenshots: {str(e)}"
        )


@router.get("/screenshots", response_model=ScreenshotListResponse)
async def list_screenshots(
    limit: int = Query(default=100, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
    url: Optional[str] = Query(default=None),
    success: Optional[bool] = Query(default=None),
    start_date: Optional[datetime] = Query(default=None),
    end_date: Optional[datetime] = Query(default=None),
    db: Session = Depends(db_manager.get_db),
    api_key: Optional[ApiKey] = Depends(get_api_key)  # Optional authentication
):
    """List screenshots with optional filters."""
    metadata_service = MetadataService(db)
    screenshots = metadata_service.get_screenshots(
        limit=limit,
        offset=offset,
        url_filter=url,
        success_filter=success,
        start_date=start_date,
        end_date=end_date,
    )
    
    total = len(screenshots)
    
    return ScreenshotListResponse(
        screenshots=[ScreenshotResponse(**s.to_dict()) for s in screenshots],
        total=total,
        limit=limit,
        offset=offset
    )


@router.get("/screenshots/{screenshot_id}", response_model=ScreenshotResponse)
async def get_screenshot(
    screenshot_id: int,
    db: Session = Depends(db_manager.get_db),
    api_key: Optional[ApiKey] = Depends(get_api_key)  # Optional authentication
):
    """Get screenshot by ID."""
    metadata_service = MetadataService(db)
    metadata = metadata_service.get_screenshot_by_id(screenshot_id)
    
    if not metadata:
        raise HTTPException(status_code=404, detail="Screenshot not found")
    
    return ScreenshotResponse(**metadata.to_dict())


@router.get("/screenshots/url/{url:path}", response_model=ScreenshotListResponse)
async def get_screenshots_by_url(
    url: str,
    limit: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(db_manager.get_db)
):
    """Get screenshots for a specific URL."""
    metadata_service = MetadataService(db)
    screenshots = metadata_service.get_screenshots_by_url(url, limit=limit)
    
    return ScreenshotListResponse(
        screenshots=[ScreenshotResponse(**s.to_dict()) for s in screenshots],
        total=len(screenshots),
        limit=limit,
        offset=0
    )


@router.get("/statistics", response_model=StatisticsResponse)
async def get_statistics(
    db: Session = Depends(db_manager.get_db),
    api_key: Optional[ApiKey] = Depends(get_api_key)  # Optional authentication
):
    """Get screenshot statistics."""
    metadata_service = MetadataService(db)
    stats = metadata_service.get_statistics()
    return StatisticsResponse(**stats)


@router.delete("/screenshots/{screenshot_id}")
async def delete_screenshot(
    screenshot_id: int,
    db: Session = Depends(db_manager.get_db)
):
    """Delete screenshot by ID."""
    metadata_service = MetadataService(db)
    deleted = metadata_service.delete_screenshot(screenshot_id)
    
    if not deleted:
        raise HTTPException(status_code=404, detail="Screenshot not found")
    
    return {"message": "Screenshot deleted successfully"}


# API Key Management Routes
api_key_router = APIRouter(prefix="/api/v1/api-keys", tags=["api-keys"])


@api_key_router.post("", response_model=ApiKeyCreateResponse)
async def create_api_key(
    request: ApiKeyCreateRequest,
    db: Session = Depends(db_manager.get_db)
):
    """Create a new API key."""
    api_key_service = ApiKeyService(db)
    plaintext_key, api_key = api_key_service.generate_api_key(
        name=request.name,
        description=request.description,
        expires_at=request.expires_at
    )
    
    return ApiKeyCreateResponse(
        api_key=ApiKeyResponse(**api_key.to_dict()),
        key=plaintext_key  # Only time plaintext is returned
    )


@api_key_router.get("", response_model=ApiKeyListResponse)
async def list_api_keys(
    include_inactive: bool = Query(default=False),
    db: Session = Depends(db_manager.get_db)
):
    """List all API keys."""
    api_key_service = ApiKeyService(db)
    keys = api_key_service.list_api_keys(include_inactive=include_inactive)
    
    return ApiKeyListResponse(
        keys=[ApiKeyResponse(**key.to_dict()) for key in keys]
    )


@api_key_router.delete("/{key_id}")
async def revoke_api_key(
    key_id: int,
    db: Session = Depends(db_manager.get_db)
):
    """Revoke an API key."""
    api_key_service = ApiKeyService(db)
    success = api_key_service.revoke_api_key(key_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="API key not found")
    
    return {"message": "API key revoked successfully"}


@api_key_router.post("/{key_id}/reactivate")
async def reactivate_api_key(
    key_id: int,
    db: Session = Depends(db_manager.get_db)
):
    """Reactivate a revoked API key."""
    api_key_service = ApiKeyService(db)
    success = api_key_service.reactivate_api_key(key_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="API key not found")
    
    return {"message": "API key reactivated successfully"}

