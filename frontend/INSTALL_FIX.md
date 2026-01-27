# Frontend Installation Fix

## Issue: canvas package build failure

The `canvas` package requires native dependencies. Install them first:

### macOS (using Homebrew)

```bash
brew install pkg-config cairo pango libpng jpeg giflib librsvg
```

Then try installing again:

```bash
cd /Users/rai/Documents/GitHub/validation-app/frontend
rm -rf node_modules package-lock.json
npm install
```

### Alternative: Remove problematic dependencies

If you don't need PDF export with images, you can remove `html2canvas` and `jspdf`:

```bash
cd /Users/rai/Documents/GitHub/validation-app/frontend
npm uninstall html2canvas jspdf
npm install
```

## Quick Fix

1. Install native dependencies:
```bash
brew install pkg-config cairo pango libpng jpeg giflib librsvg
```

2. Clean and reinstall:
```bash
cd /Users/rai/Documents/GitHub/validation-app/frontend
rm -rf node_modules package-lock.json
npm install
```

3. Start the dev server:
```bash
npm run dev
```

