"""SQLAlchemy models for screenshot metadata and API keys."""
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


class ApiKey(Base):
    """Model for API key authentication."""
    
    __tablename__ = "api_keys"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)  # User-friendly name for the key
    description = Column(Text, nullable=True)
    key_hash = Column(String, nullable=False, unique=True, index=True)  # Hashed API key
    key_prefix = Column(String, nullable=False, index=True)  # First 8 chars for display (e.g., "sk_live_")
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_used_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)  # Optional expiration
    request_count = Column(Integer, default=0, nullable=False)  # Track usage
    
    def to_dict(self, include_key: bool = False) -> dict:
        """Convert to dictionary."""
        result = {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "key_prefix": self.key_prefix,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_used_at": self.last_used_at.isoformat() if self.last_used_at else None,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "request_count": self.request_count,
        }
        # Never include full key hash in response
        return result

