"""Service for managing API keys."""
import secrets
import bcrypt
from typing import List, Optional, Tuple
from datetime import datetime
from sqlalchemy.orm import Session
from app.database.models import ApiKey
from app.config import settings


class ApiKeyService:
    """Service for API key operations."""
    
    def __init__(self, db_session: Session):
        """Initialize API key service."""
        self.db = db_session
    
    def generate_api_key(
        self,
        name: str,
        description: Optional[str] = None,
        expires_at: Optional[datetime] = None,
    ) -> Tuple[str, ApiKey]:
        """Generate a new API key.
        
        Returns:
            Tuple of (plaintext_key, ApiKey object)
            Note: Plaintext key is only returned once on creation.
        """
        # Generate secure random key
        random_bytes = secrets.token_urlsafe(32)
        plaintext_key = f"{settings.api_key_prefix}{random_bytes}"
        
        # Hash the key using bcrypt
        key_hash = bcrypt.hashpw(plaintext_key.encode('utf-8'), bcrypt.gensalt(rounds=12)).decode('utf-8')
        
        # Store prefix for display
        key_prefix = plaintext_key[:len(settings.api_key_prefix) + 8]  # Prefix + 8 chars
        
        # Create API key record
        api_key = ApiKey(
            name=name,
            description=description,
            key_hash=key_hash,
            key_prefix=key_prefix,
            expires_at=expires_at,
        )
        
        self.db.add(api_key)
        self.db.commit()
        self.db.refresh(api_key)
        
        return plaintext_key, api_key
    
    def validate_api_key(self, api_key: str) -> Optional[ApiKey]:
        """Validate an API key.
        
        Returns:
            ApiKey object if valid and active, None otherwise
        """
        # Get all active API keys
        active_keys = self.db.query(ApiKey).filter(
            ApiKey.is_active == True
        ).all()
        
        # Check each key hash
        for key_record in active_keys:
            try:
                if bcrypt.checkpw(api_key.encode('utf-8'), key_record.key_hash.encode('utf-8')):
                    # Check expiration
                    if key_record.expires_at and key_record.expires_at < datetime.utcnow():
                        return None
                    return key_record
            except Exception:
                # Invalid hash format or other error
                continue
        
        return None
    
    def get_api_key_by_id(self, key_id: int) -> Optional[ApiKey]:
        """Get API key by ID."""
        return self.db.query(ApiKey).filter(ApiKey.id == key_id).first()
    
    def list_api_keys(self, include_inactive: bool = False) -> List[ApiKey]:
        """List all API keys."""
        query = self.db.query(ApiKey)
        
        if not include_inactive:
            query = query.filter(ApiKey.is_active == True)
        
        return query.order_by(ApiKey.created_at.desc()).all()
    
    def revoke_api_key(self, key_id: int) -> bool:
        """Revoke an API key (soft delete)."""
        api_key = self.get_api_key_by_id(key_id)
        if not api_key:
            return False
        
        api_key.is_active = False
        self.db.commit()
        return True
    
    def reactivate_api_key(self, key_id: int) -> bool:
        """Reactivate a revoked API key."""
        api_key = self.get_api_key_by_id(key_id)
        if not api_key:
            return False
        
        api_key.is_active = True
        self.db.commit()
        return True
    
    def update_last_used(self, key_id: int) -> None:
        """Update last used timestamp and increment request count."""
        api_key = self.get_api_key_by_id(key_id)
        if api_key:
            api_key.last_used_at = datetime.utcnow()
            api_key.request_count += 1
            self.db.commit()
    
    def delete_api_key(self, key_id: int) -> bool:
        """Permanently delete an API key."""
        api_key = self.get_api_key_by_id(key_id)
        if not api_key:
            return False
        
        self.db.delete(api_key)
        self.db.commit()
        return True
