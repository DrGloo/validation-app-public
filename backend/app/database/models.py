"""SQLAlchemy models for screenshot metadata."""
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()


class ScreenshotMetadata(Base):
    """Model for storing screenshot metadata."""
    
    __tablename__ = "screenshots"
    
    id = Column(Integer, primary_key=True, index=True)
    url = Column(String, nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    viewport_width = Column(Integer, nullable=False)
    viewport_height = Column(Integer, nullable=False)
    file_path = Column(String, nullable=True)
    base64_data = Column(Text, nullable=True)
    http_status_code = Column(Integer, nullable=True)
    page_load_time_ms = Column(Float, nullable=True)
    full_page = Column(Boolean, default=False)
    wait_strategy = Column(String, nullable=True)
    error_message = Column(Text, nullable=True)
    success = Column(Boolean, default=True, index=True)
    
    def to_dict(self) -> dict:
        """Convert model to dictionary."""
        return {
            "id": self.id,
            "url": self.url,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "viewport_width": self.viewport_width,
            "viewport_height": self.viewport_height,
            "file_path": self.file_path,
            "base64_data": self.base64_data,
            "http_status_code": self.http_status_code,
            "page_load_time_ms": self.page_load_time_ms,
            "full_page": self.full_page,
            "wait_strategy": self.wait_strategy,
            "error_message": self.error_message,
            "success": self.success,
        }

