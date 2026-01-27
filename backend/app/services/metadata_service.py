"""Service for managing screenshot metadata in database."""
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_, or_
from app.database.models import ScreenshotMetadata
from app.services.screenshot_service import ScreenshotResult


class MetadataService:
    """Service for screenshot metadata operations."""
    
    def __init__(self, db_session: Session):
        """Initialize metadata service."""
        self.db = db_session
    
    def save_screenshot_metadata(self, result: ScreenshotResult) -> ScreenshotMetadata:
        """Save screenshot metadata to database."""
        metadata = ScreenshotMetadata(
            url=result.url,
            timestamp=datetime.utcnow(),
            viewport_width=result.viewport_width,
            viewport_height=result.viewport_height,
            file_path=result.file_path,
            base64_data=result.base64_data,
            http_status_code=result.http_status_code,
            page_load_time_ms=result.page_load_time_ms,
            full_page=result.full_page,
            wait_strategy=result.wait_strategy,
            error_message=result.error_message,
            success=result.success,
        )
        self.db.add(metadata)
        self.db.commit()
        self.db.refresh(metadata)
        return metadata
    
    def get_screenshot_by_id(self, screenshot_id: int) -> Optional[ScreenshotMetadata]:
        """Get screenshot metadata by ID."""
        return self.db.query(ScreenshotMetadata).filter(
            ScreenshotMetadata.id == screenshot_id
        ).first()
    
    def get_screenshots(
        self,
        limit: int = 100,
        offset: int = 0,
        url_filter: Optional[str] = None,
        success_filter: Optional[bool] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> List[ScreenshotMetadata]:
        """Get screenshots with filters."""
        query = self.db.query(ScreenshotMetadata)
        
        if url_filter:
            query = query.filter(ScreenshotMetadata.url.contains(url_filter))
        
        if success_filter is not None:
            query = query.filter(ScreenshotMetadata.success == success_filter)
        
        if start_date:
            query = query.filter(ScreenshotMetadata.timestamp >= start_date)
        
        if end_date:
            query = query.filter(ScreenshotMetadata.timestamp <= end_date)
        
        return query.order_by(desc(ScreenshotMetadata.timestamp)).limit(limit).offset(offset).all()
    
    def get_screenshots_by_url(self, url: str, limit: int = 10) -> List[ScreenshotMetadata]:
        """Get recent screenshots for a specific URL."""
        return self.db.query(ScreenshotMetadata).filter(
            ScreenshotMetadata.url == url
        ).order_by(desc(ScreenshotMetadata.timestamp)).limit(limit).all()
    
    def get_statistics(self) -> dict:
        """Get screenshot statistics."""
        try:
            total = self.db.query(ScreenshotMetadata).count()
            successful = self.db.query(ScreenshotMetadata).filter(
                ScreenshotMetadata.success == True
            ).count()
            failed = total - successful
            
            return {
                "total": total,
                "successful": successful,
                "failed": failed,
                "success_rate": (successful / total * 100) if total > 0 else 0.0,
            }
        except Exception as e:
            # Return default stats if database query fails
            return {
                "total": 0,
                "successful": 0,
                "failed": 0,
                "success_rate": 0.0,
            }
    
    def delete_screenshot(self, screenshot_id: int) -> bool:
        """Delete screenshot metadata."""
        metadata = self.get_screenshot_by_id(screenshot_id)
        if metadata:
            self.db.delete(metadata)
            self.db.commit()
            return True
        return False

