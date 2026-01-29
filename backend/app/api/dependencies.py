"""FastAPI dependencies for authentication."""
from typing import Optional
from fastapi import Header, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database.database import db_manager
from app.database.models import ApiKey
from app.services.api_key_service import ApiKeyService


async def get_api_key(
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    db: Session = Depends(db_manager.get_db)
) -> Optional[ApiKey]:
    """Dependency for optional API key authentication.
    
    Returns:
        ApiKey object if valid key provided, None if no key provided
        Raises HTTPException if invalid key provided
    """
    if not x_api_key:
        return None
    
    api_key_service = ApiKeyService(db)
    api_key = api_key_service.validate_api_key(x_api_key)
    
    if not api_key:
        raise HTTPException(
            status_code=401,
            detail="Invalid or inactive API key"
        )
    
    # Update last used timestamp
    api_key_service.update_last_used(api_key.id)
    
    return api_key


async def require_api_key(
    api_key: Optional[ApiKey] = Depends(get_api_key)
) -> ApiKey:
    """Dependency for required API key authentication.
    
    Returns:
        ApiKey object
        Raises HTTPException if no key or invalid key provided
    """
    if not api_key:
        raise HTTPException(
            status_code=401,
            detail="API key required. Provide X-API-Key header."
        )
    return api_key
