"""Service for capturing screenshots using Playwright."""
import asyncio
import base64
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any
from playwright.async_api import async_playwright, Browser, Page, TimeoutError as PlaywrightTimeoutError
from app.config import settings


class ScreenshotOptions:
    """Configuration options for screenshot capture."""
    
    def __init__(
        self,
        full_page: bool = False,
        viewport_width: int = 1920,
        viewport_height: int = 1080,
        wait_strategy: str = "networkidle",
        wait_selector: Optional[str] = None,
        delay_ms: int = 0,
        timeout_ms: int = 30000,
        auth_headers: Optional[Dict[str, str]] = None,
        basic_auth: Optional[Dict[str, str]] = None,
    ):
        """Initialize screenshot options."""
        self.full_page = full_page
        self.viewport_width = viewport_width
        self.viewport_height = viewport_height
        self.wait_strategy = wait_strategy
        self.wait_selector = wait_selector
        self.delay_ms = delay_ms
        self.timeout_ms = timeout_ms
        self.auth_headers = auth_headers or {}
        self.basic_auth = basic_auth
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "full_page": self.full_page,
            "viewport_width": self.viewport_width,
            "viewport_height": self.viewport_height,
            "wait_strategy": self.wait_strategy,
            "wait_selector": self.wait_selector,
            "delay_ms": self.delay_ms,
            "timeout_ms": self.timeout_ms,
        }


class ScreenshotResult:
    """Result of screenshot capture operation."""
    
    def __init__(
        self,
        success: bool,
        url: str,
        file_path: Optional[str] = None,
        base64_data: Optional[str] = None,
        http_status_code: Optional[int] = None,
        page_load_time_ms: Optional[float] = None,
        error_message: Optional[str] = None,
        viewport_width: int = 1920,
        viewport_height: int = 1080,
        full_page: bool = False,
        wait_strategy: Optional[str] = None,
    ):
        """Initialize screenshot result."""
        self.success = success
        self.url = url
        self.file_path = file_path
        self.base64_data = base64_data
        self.http_status_code = http_status_code
        self.page_load_time_ms = page_load_time_ms
        self.error_message = error_message
        self.viewport_width = viewport_width
        self.viewport_height = viewport_height
        self.full_page = full_page
        self.wait_strategy = wait_strategy
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "success": self.success,
            "url": self.url,
            "file_path": self.file_path,
            "base64_data": self.base64_data,
            "http_status_code": self.http_status_code,
            "page_load_time_ms": self.page_load_time_ms,
            "error_message": self.error_message,
            "viewport_width": self.viewport_width,
            "viewport_height": self.viewport_height,
            "full_page": self.full_page,
            "wait_strategy": self.wait_strategy,
        }


class ScreenshotService:
    """Service for capturing webpage screenshots."""
    
    def __init__(self):
        """Initialize screenshot service."""
        self.browser: Optional[Browser] = None
        self.screenshots_dir = Path(settings.screenshots_dir)
        self.screenshots_dir.mkdir(parents=True, exist_ok=True)
    
    async def initialize(self) -> None:
        """Initialize Playwright browser."""
        if self.browser is None:
            try:
                self.playwright = await async_playwright().start()
                self.browser = await self.playwright.chromium.launch(
                    headless=settings.playwright_headless,
                    args=["--no-sandbox", "--disable-setuid-sandbox"]
                )
            except Exception as e:
                raise RuntimeError(
                    f"Failed to initialize Playwright browser. "
                    f"Make sure Chromium is installed: playwright install chromium. "
                    f"Error: {str(e)}"
                )
    
    async def close(self) -> None:
        """Close browser and cleanup."""
        if self.browser:
            await self.browser.close()
            await self.playwright.stop()
            self.browser = None
    
    def _generate_filename(self, url: str) -> str:
        """Generate filename for screenshot."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        url_safe = "".join(c if c.isalnum() or c in "-_." else "_" for c in url[:50])
        return f"{timestamp}_{url_safe}.png"
    
    async def _wait_for_condition(
        self,
        page: Page,
        wait_strategy: str,
        wait_selector: Optional[str],
        timeout_ms: int
    ) -> None:
        """Wait for page condition based on strategy."""
        if wait_strategy == "networkidle":
            await page.wait_for_load_state("networkidle", timeout=timeout_ms)
        elif wait_strategy == "domcontentloaded":
            await page.wait_for_load_state("domcontentloaded", timeout=timeout_ms)
        elif wait_strategy == "load":
            await page.wait_for_load_state("load", timeout=timeout_ms)
        elif wait_strategy == "selector" and wait_selector:
            await page.wait_for_selector(wait_selector, timeout=timeout_ms)
        elif wait_strategy == "commit":
            await page.wait_for_load_state("commit", timeout=timeout_ms)
    
    async def capture_screenshot(
        self,
        url: str,
        options: ScreenshotOptions
    ) -> ScreenshotResult:
        """Capture screenshot of URL."""
        await self.initialize()
        
        start_time = datetime.now()
        page: Optional[Page] = None
        
        try:
            # Create new page
            context = await self.browser.new_context(
                viewport={
                    "width": options.viewport_width,
                    "height": options.viewport_height
                },
                ignore_https_errors=True
            )
            
            page = await context.new_page()
            
            # Set authentication headers if provided
            if options.auth_headers:
                await page.set_extra_http_headers(options.auth_headers)
            
            # Set basic auth if provided
            if options.basic_auth:
                await context.set_http_credentials({
                    "username": options.basic_auth.get("username", ""),
                    "password": options.basic_auth.get("password", ""),
                })
            
            # Navigate to URL
            response = await page.goto(url, wait_until="commit", timeout=options.timeout_ms)
            http_status = response.status if response else None
            
            # Wait for condition
            await self._wait_for_condition(
                page,
                options.wait_strategy,
                options.wait_selector,
                options.timeout_ms
            )
            
            # Delay if specified
            if options.delay_ms > 0:
                await asyncio.sleep(options.delay_ms / 1000.0)
            
            # Calculate load time
            load_time = (datetime.now() - start_time).total_seconds() * 1000
            
            # Generate filename and path
            filename = self._generate_filename(url)
            file_path = self.screenshots_dir / filename
            
            # Take screenshot
            await page.screenshot(
                path=str(file_path),
                full_page=options.full_page
            )
            
            # Read and encode as base64
            with open(file_path, "rb") as f:
                image_data = f.read()
                base64_data = base64.b64encode(image_data).decode("utf-8")
            
            return ScreenshotResult(
                success=True,
                url=url,
                file_path=str(file_path),
                base64_data=base64_data,
                http_status_code=http_status,
                page_load_time_ms=load_time,
                viewport_width=options.viewport_width,
                viewport_height=options.viewport_height,
                full_page=options.full_page,
                wait_strategy=options.wait_strategy,
            )
        
        except PlaywrightTimeoutError as e:
            load_time = (datetime.now() - start_time).total_seconds() * 1000
            return ScreenshotResult(
                success=False,
                url=url,
                error_message=f"Timeout: {str(e)}",
                page_load_time_ms=load_time,
                viewport_width=options.viewport_width,
                viewport_height=options.viewport_height,
                full_page=options.full_page,
                wait_strategy=options.wait_strategy,
            )
        
        except Exception as e:
            load_time = (datetime.now() - start_time).total_seconds() * 1000
            return ScreenshotResult(
                success=False,
                url=url,
                error_message=f"Error: {str(e)}",
                page_load_time_ms=load_time,
                viewport_width=options.viewport_width,
                viewport_height=options.viewport_height,
                full_page=options.full_page,
                wait_strategy=options.wait_strategy,
            )
        
        finally:
            if page:
                await page.close()
            if 'context' in locals():
                await context.close()


# Global screenshot service instance
screenshot_service = ScreenshotService()

