# Troubleshooting Screenshot Capture Failures

## Common Issues and Solutions

### 1. "Failed to capture screenshot" - General Error

**Check the error message in the screenshot details page** - it will show the specific reason.

### 2. Playwright Browser Not Installed

**Symptoms:**
- Error mentions "chromium" or "browser not found"
- Error: "Failed to initialize Playwright browser"

**Solution:**
```bash
cd /Users/rai/Documents/GitHub/validation-app/backend
source venv/bin/activate
playwright install chromium
```

### 3. Timeout Errors

**Symptoms:**
- Error message: "Timeout: ..."
- Screenshot takes too long

**Solutions:**
- Increase the timeout in capture options (default: 30000ms = 30 seconds)
- Try a different wait strategy (e.g., "domcontentloaded" instead of "networkidle")
- Check if the URL is slow to load

### 4. Invalid URL or Network Errors

**Symptoms:**
- Error: "net::ERR_NAME_NOT_RESOLVED" or similar
- HTTP status code errors

**Solutions:**
- Verify the URL is correct and accessible
- Check if the URL requires authentication
- Try accessing the URL in a regular browser first
- For localhost URLs, make sure the service is running

### 5. SSL Certificate Errors

**Symptoms:**
- Error: "net::ERR_CERT_*"
- SSL/TLS certificate issues

**Solutions:**
- The service already ignores HTTPS errors by default
- If still failing, check if the URL is using a valid certificate
- For self-signed certificates, they should work with `ignore_https_errors=True`

### 6. Authentication Required

**Symptoms:**
- HTTP 401 or 403 errors
- Page requires login

**Solutions:**
- Use the "Auth Headers" option to add authentication tokens
- Use "Basic Auth" for HTTP basic authentication
- Add cookies if needed (may require code changes)

### 7. Page Not Loading

**Symptoms:**
- Timeout waiting for selector
- Page loads but screenshot is blank

**Solutions:**
- Increase delay before capture
- Change wait strategy to "load" or "domcontentloaded"
- Use "selector" wait strategy with a specific CSS selector that appears when page is ready

### 8. Backend Not Running

**Symptoms:**
- Network error in frontend
- Cannot connect to API

**Solutions:**
```bash
cd /Users/rai/Documents/GitHub/validation-app/backend
source venv/bin/activate
python run.py
```

Verify backend is running: http://localhost:8000/health

### 9. Viewport Size Issues

**Symptoms:**
- Screenshot doesn't match expected size
- Elements cut off

**Solutions:**
- Use "Full page" option for complete page capture
- Adjust viewport width/height
- Try different preset sizes (Desktop, Laptop, Tablet, Mobile)

## Debugging Steps

1. **Check the screenshot details page** - it shows the exact error message
2. **Check backend logs** - look for Python exceptions
3. **Test the URL manually** - open it in a browser first
4. **Check network connectivity** - ensure the URL is accessible
5. **Verify Playwright installation**:
   ```bash
   cd backend
   source venv/bin/activate
   playwright --version
   playwright install chromium
   ```

## Getting More Details

The error message in the screenshot metadata contains the specific failure reason. View the failed screenshot in the History page to see:
- Error message
- HTTP status code (if available)
- Page load time
- URL attempted

## Common Error Messages

- **"Timeout: ..."** - Page took too long to load, increase timeout
- **"net::ERR_NAME_NOT_RESOLVED"** - Invalid URL or DNS issue
- **"net::ERR_CONNECTION_REFUSED"** - Server not running or wrong port
- **"Failed to initialize Playwright browser"** - Install Chromium: `playwright install chromium`
- **"HTTP 404"** - URL not found
- **"HTTP 401/403"** - Authentication required

