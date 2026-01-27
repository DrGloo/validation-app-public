"""Pydantic schemas for API requests and responses."""
from pydantic import BaseModel, HttpUrl, Field
from typing import Optional, Dict, List
from datetime import datetime


class ScreenshotOptionsRequest(BaseModel):
    """Request schema for screenshot options."""
    full_page: bool = False
    viewport_width: int = Field(default=1920, ge=1, le=7680)
    viewport_height: int = Field(default=1080, ge=1, le=4320)
    wait_strategy: str = Field(default="networkidle", pattern="^(networkidle|domcontentloaded|load|commit|selector)$")
    wait_selector: Optional[str] = None
    delay_ms: int = Field(default=0, ge=0, le=60000)
    timeout_ms: int = Field(default=30000, ge=1000, le=300000)
    auth_headers: Optional[Dict[str, str]] = None
    basic_auth: Optional[Dict[str, str]] = None


class SingleScreenshotRequest(BaseModel):
    """Request schema for single screenshot."""
    url: str = Field(..., min_length=1)
    options: Optional[ScreenshotOptionsRequest] = None


class BatchScreenshotRequest(BaseModel):
    """Request schema for batch screenshots."""
    urls: List[str] = Field(..., min_items=1, max_items=100)
    options: Optional[ScreenshotOptionsRequest] = None


class ScreenshotResponse(BaseModel):
    """Response schema for screenshot."""
    id: int
    url: str
    timestamp: datetime
    viewport_width: int
    viewport_height: int
    file_path: Optional[str] = None
    base64_data: Optional[str] = None
    http_status_code: Optional[int] = None
    page_load_time_ms: Optional[float] = None
    full_page: bool
    wait_strategy: Optional[str] = None
    error_message: Optional[str] = None
    success: bool
    
    class Config:
        from_attributes = True


class BatchScreenshotResponse(BaseModel):
    """Response schema for batch screenshot operation."""
    results: List[ScreenshotResponse]
    total: int
    successful: int
    failed: int


class StatisticsResponse(BaseModel):
    """Response schema for statistics."""
    total: int
    successful: int
    failed: int
    success_rate: float


class ScreenshotListResponse(BaseModel):
    """Response schema for screenshot list."""
    screenshots: List[ScreenshotResponse]
    total: int
    limit: int
    offset: int

