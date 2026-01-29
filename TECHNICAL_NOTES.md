# Technical Notes

This document contains technical implementation details, architecture decisions, and notes for developers working on the Screenshot Validation App.

## Table of Contents

- [API Key Authentication](#api-key-authentication)
- [Database Architecture](#database-architecture)
- [Service Layer Pattern](#service-layer-pattern)
- [API Design](#api-design)
- [Security Considerations](#security-considerations)
- [Performance Considerations](#performance-considerations)
- [Future Enhancements](#future-enhancements)

---

## API Key Authentication

### Overview

API key authentication provides secure programmatic access to the API while maintaining optional authentication for the frontend. Keys are stored securely using bcrypt hashing and support usage tracking, expiration, and revocation.

### Implementation Details

#### Key Generation

- **Format**: `sk_live_{32-byte-random-token}`
- **Generation**: Uses Python's `secrets.token_urlsafe(32)` for cryptographically secure random tokens
- **Hashing**: Bcrypt with cost factor 12 (configurable)
- **Storage**: Only hashed keys stored in database, never plaintext

#### Key Validation Flow

```
1. Client sends request with X-API-Key header
2. Dependency extracts header value
3. ApiKeyService validates key:
   - Hashes provided key
   - Compares against all active key hashes in database
   - Checks expiration date
   - Verifies is_active flag
4. If valid: Updates last_used_at and increments request_count
5. Returns ApiKey object or raises 401
```

#### Database Schema

```sql
CREATE TABLE api_keys (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    key_hash TEXT NOT NULL UNIQUE,  -- Bcrypt hash
    key_prefix TEXT NOT NULL,        -- Display prefix (e.g., "sk_live_abc")
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME NOT NULL,
    last_used_at DATETIME,
    expires_at DATETIME,
    request_count INTEGER DEFAULT 0
);
```

#### Security Considerations

- **Never store plaintext keys** - Only hashed values in database
- **Show key only once** - Plaintext key returned only on creation
- **Bcrypt hashing** - One-way hashing prevents key recovery
- **Expiration support** - Optional expiration dates for temporary access
- **Soft delete** - Revocation via is_active flag preserves audit trail

#### Performance Notes

- **Key lookup**: Currently iterates through all active keys (O(n))
  - Acceptable for small-medium number of keys (<1000)
  - Future optimization: Add key_prefix index for faster lookups
- **Bcrypt verification**: ~100ms per check (by design for security)
- **Database queries**: Single query for all active keys, then in-memory comparison

#### Configuration

Located in `backend/app/config.py`:

```python
api_auth_enabled: bool = False      # Feature flag
api_key_required: bool = False     # Require keys for all endpoints
api_key_header_name: str = "X-API-Key"
api_key_prefix: str = "sk_live_"
```

#### API Endpoints

- `POST /api/v1/api-keys` - Create new API key
- `GET /api/v1/api-keys` - List all API keys
- `DELETE /api/v1/api-keys/{id}` - Revoke API key
- `POST /api/v1/api-keys/{id}/reactivate` - Reactivate revoked key

#### Usage Example

```python
# Creating a key
response = requests.post('http://localhost:8000/api/v1/api-keys', json={
    'name': 'Production Key',
    'description': 'For production monitoring'
})
# Response includes plaintext key (save securely!)
key = response.json()['key']

# Using a key
response = requests.post(
    'http://localhost:8000/api/v1/screenshot',
    headers={'X-API-Key': key},
    json={'url': 'https://example.com'}
)
```

---

## Database Architecture

### Models

#### ScreenshotMetadata

Stores screenshot capture metadata and results.

**Key Fields**:
- `id`: Primary key
- `url`: Target URL (indexed)
- `timestamp`: Capture time (indexed)
- `base64_data`: Screenshot image data (for frontend display)
- `file_path`: Path to stored screenshot file
- `success`: Boolean flag for capture success (indexed)
- `http_status_code`: HTTP response code
- `page_load_time_ms`: Performance metric

**Indexes**:
- `url` - For filtering by URL
- `timestamp` - For chronological queries
- `success` - For filtering successful/failed captures

#### ApiKey

Stores API key authentication data.

**Key Fields**:
- `key_hash`: Bcrypt hash of the API key (unique, indexed)
- `key_prefix`: Display prefix for identification
- `is_active`: Soft delete flag (indexed)
- `request_count`: Usage counter
- `expires_at`: Optional expiration date

**Indexes**:
- `key_hash` - For key validation lookups
- `is_active` - For filtering active keys
- `key_prefix` - For display and potential optimization

### Database Manager

**File**: `backend/app/database/database.py`

- **Pattern**: Singleton pattern with global `db_manager` instance
- **Session Management**: Generator-based dependency injection for FastAPI
- **Connection**: SQLite with thread-safe configuration
- **Table Creation**: Automatic via SQLAlchemy metadata

**Critical Pattern**:
```python
def get_db(self) -> Generator[Session, None, None]:
    """Must be generator, not context manager."""
    session = self.SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
```

---

## Service Layer Pattern

### Architecture

Business logic is separated from API routes through service classes:

```
API Routes → Services → Database Models
```

### Service Classes

#### MetadataService

**Purpose**: Database operations for screenshot metadata

**Key Methods**:
- `save_screenshot_metadata()` - Persist screenshot result
- `get_screenshots()` - Query with filters (URL, success, date range)
- `get_statistics()` - Aggregate statistics
- `delete_screenshot()` - Remove screenshot

**Pattern**: Receives database session via constructor, uses `self.db` for queries

#### ApiKeyService

**Purpose**: API key generation, validation, and management

**Key Methods**:
- `generate_api_key()` - Create new key with hashing
- `validate_api_key()` - Verify key and check expiration
- `update_last_used()` - Track usage statistics
- `revoke_api_key()` - Soft delete via is_active flag

**Security**: Handles all cryptographic operations (hashing, key generation)

#### ScreenshotService

**Purpose**: Playwright browser automation for screenshot capture

**Key Methods**:
- `initialize()` - Start Playwright browser (called on app startup)
- `capture_screenshot()` - Main capture logic
- `close()` - Cleanup browser on shutdown

**Lifecycle**: Browser instance created once on startup, reused for all requests

### Dependency Injection

FastAPI's `Depends()` provides database sessions and authentication:

```python
@router.post("/screenshot")
async def capture_screenshot(
    request: SingleScreenshotRequest,
    db: Session = Depends(db_manager.get_db),  # Database session
    api_key: Optional[ApiKey] = Depends(get_api_key)  # Optional auth
):
    metadata_service = MetadataService(db)  # Service receives session
    # ... use service ...
```

---

## API Design

### RESTful Conventions

- **GET**: Retrieve resources (list, get by ID)
- **POST**: Create resources
- **PUT**: Update resources (full update)
- **DELETE**: Remove resources

### Response Patterns

**Success Responses**:
- `200 OK`: Successful GET/PUT/DELETE
- `201 Created`: Successful POST
- Response includes resource data

**Error Responses**:
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required/failed
- `404 Not Found`: Resource not found
- `422 Unprocessable Entity`: Validation errors
- `500 Internal Server Error`: Server errors

### Request/Response Schemas

All requests and responses use Pydantic models for:
- **Validation**: Automatic request validation
- **Documentation**: Auto-generated OpenAPI/Swagger docs
- **Type Safety**: Type hints throughout

**Example**:
```python
class ScreenshotResponse(BaseModel):
    id: int
    url: str
    timestamp: datetime
    # ... other fields ...
    
    class Config:
        from_attributes = True  # Enable ORM conversion
```

### Authentication Headers

- **Header Name**: `X-API-Key` (configurable)
- **Optional by Default**: Frontend works without keys
- **Required Option**: Can use `require_api_key` dependency for protected endpoints

---

## Security Considerations

### API Key Security

1. **Hashing**: Bcrypt with cost factor 12
   - One-way hashing prevents key recovery
   - Cost factor balances security vs performance

2. **Key Storage**: Never store plaintext
   - Plaintext key shown only once on creation
   - Client must save securely (not stored by server)

3. **Key Validation**: Secure comparison
   - Constant-time comparison via bcrypt.checkpw()
   - Prevents timing attacks

4. **Expiration**: Optional expiration dates
   - Automatic invalidation of expired keys
   - Useful for temporary access

### Database Security

- **SQL Injection**: Prevented by SQLAlchemy ORM
- **Connection Security**: SQLite file permissions
- **Data Encryption**: Consider encrypting sensitive fields at rest (future)

### API Security

- **CORS**: Configured for specific origins
- **HTTPS**: Required in production (keys sent in headers)
- **Rate Limiting**: Not yet implemented (future enhancement)

### Best Practices

1. **Never log API keys** - Even in error messages
2. **Use HTTPS** - Always in production
3. **Rotate keys regularly** - Support revocation/reactivation
4. **Monitor usage** - Track request_count and last_used_at
5. **Set expiration** - For temporary access

---

## Performance Considerations

### Database Queries

- **Indexes**: Key fields indexed for fast lookups
- **Query Optimization**: Use filters to limit result sets
- **Connection Pooling**: SQLite handles connections efficiently

### API Key Validation

- **Current**: O(n) lookup through all active keys
- **Acceptable**: For <1000 keys
- **Future**: Add key_prefix index for faster lookups

### Screenshot Capture

- **Browser Reuse**: Single browser instance shared across requests
- **Context Isolation**: New context per request for security
- **Async Operations**: Non-blocking async/await pattern

### Caching Opportunities

- **Statistics**: Could cache aggregate statistics
- **API Key Lookup**: Could cache active keys (invalidate on create/revoke)
- **Screenshot Metadata**: Consider caching recent screenshots

---

## Future Enhancements

### API Key Improvements

1. **Rate Limiting**: Per-key rate limits
   - Track requests per time window
   - Return 429 Too Many Requests

2. **Key Scoping**: Restrict keys to specific endpoints
   - Add `allowed_endpoints` field
   - Validate in dependency

3. **Key Permissions**: Fine-grained permissions
   - Read-only vs write access
   - Project-level permissions

4. **IP Whitelisting**: Restrict keys to IP addresses
   - Add `allowed_ips` field
   - Validate source IP

5. **Usage Analytics**: Enhanced tracking
   - Per-endpoint usage
   - Time-series data
   - Dashboard visualization

### Database Improvements

1. **Migrations**: Use Alembic for schema migrations
2. **Connection Pooling**: For PostgreSQL (if migrated)
3. **Read Replicas**: For scaling read operations

### API Improvements

1. **Pagination**: Cursor-based pagination for large result sets
2. **Filtering**: More advanced filtering options
3. **Sorting**: Custom sort orders
4. **Bulk Operations**: Batch create/update/delete

### Monitoring & Observability

1. **Logging**: Structured logging with correlation IDs
2. **Metrics**: Prometheus metrics endpoint
3. **Tracing**: Distributed tracing for request flow
4. **Health Checks**: Enhanced health check endpoint

---

## Code Organization

### File Structure

```
backend/
├── app/
│   ├── api/
│   │   ├── dependencies.py      # Auth dependencies
│   │   ├── routes.py            # API endpoints
│   │   └── schemas.py           # Pydantic models
│   ├── database/
│   │   ├── database.py          # Database manager
│   │   └── models.py            # SQLAlchemy models
│   ├── services/
│   │   ├── api_key_service.py   # API key operations
│   │   ├── metadata_service.py  # Screenshot metadata
│   │   └── screenshot_service.py # Playwright automation
│   ├── config.py                # Configuration
│   └── main.py                  # FastAPI app
```

### Design Principles

1. **Single Responsibility**: Each service/class has one purpose
2. **Dependency Injection**: Services receive dependencies via constructor
3. **Separation of Concerns**: Routes → Services → Database
4. **Type Safety**: Type hints throughout
5. **Error Handling**: Consistent error responses

### Testing Considerations

1. **Unit Tests**: Test services in isolation
2. **Integration Tests**: Test API endpoints with test database
3. **Mocking**: Mock external dependencies (Playwright, database)
4. **Fixtures**: Use pytest fixtures for test data

---

## Configuration

### Environment Variables

**Backend** (`.env`):
```env
DEBUG=false
DATABASE_URL=sqlite:///./screenshots.db
SCREENSHOTS_DIR=./screenshots
API_HOST=0.0.0.0
API_PORT=8000
API_AUTH_ENABLED=false
API_KEY_REQUIRED=false
```

**Frontend** (`.env`):
```env
VITE_API_URL=http://localhost:8000/api/v1
```

### Configuration Loading

- Uses `pydantic-settings` for type-safe configuration
- Loads from `.env` file automatically
- Environment variables override defaults
- Case-insensitive variable names

---

## Deployment Notes

### Database Migration

When deploying updates:
1. Database tables auto-create on startup
2. Existing data preserved
3. New columns added automatically (SQLite)
4. Consider Alembic for production migrations

### API Key Migration

For existing deployments:
1. No migration needed - feature is additive
2. Existing functionality continues to work
3. API keys optional by default
4. Can enable gradually via feature flags

### Performance Tuning

- **SQLite**: Good for small-medium deployments
- **PostgreSQL**: Consider for larger scale
- **Connection Pooling**: Configure for production
- **Caching**: Add Redis for high-traffic scenarios

---

## Troubleshooting

### Common Issues

**API Key Validation Fails**:
- Check key format (must include prefix)
- Verify key is active (`is_active=True`)
- Check expiration date
- Verify bcrypt hash matches

**Database Connection Errors**:
- Check file permissions for SQLite database
- Verify database path in configuration
- Ensure database directory exists

**Performance Issues**:
- Check database indexes
- Review query patterns
- Consider connection pooling
- Monitor API key lookup performance

---

## References

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Bcrypt Documentation](https://github.com/pyca/bcrypt/)
- [Playwright Documentation](https://playwright.dev/python/)

---

**Last Updated**: January 2026
**Maintainer**: Development Team
