"""Application configuration settings."""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""
    
    app_name: str = "Screenshot Validation API"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # Database
    database_url: str = "sqlite:///./screenshots.db"
    
    # Screenshot storage
    screenshots_dir: str = "./screenshots"
    max_screenshot_size_mb: int = 10
    
    # Playwright settings
    playwright_timeout: int = 30000
    playwright_headless: bool = True
    playwright_viewport_width: int = 1920
    playwright_viewport_height: int = 1080
    
    # API settings
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]
    
    class Config:
        """Pydantic config."""
        env_file = ".env"
        case_sensitive = False


settings = Settings()

