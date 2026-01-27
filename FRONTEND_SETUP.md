# Frontend Setup Instructions

## Issue: npm install permission errors

If you're getting permission errors when running `npm install`, try these solutions:

### Solution 1: Install dependencies manually

```bash
cd /Users/rai/Documents/GitHub/validation-app/frontend
npm install
```

### Solution 2: Fix npm permissions

If you get permission errors, try:

```bash
# Clear npm cache
npm cache clean --force

# Try installing again
cd /Users/rai/Documents/GitHub/validation-app/frontend
npm install
```

### Solution 3: Use npx to run vite directly

If dependencies are installed but vite command is not found:

```bash
cd /Users/rai/Documents/GitHub/validation-app/frontend
npx vite
```

### Solution 4: Check node_modules

Verify that dependencies are installed:

```bash
cd /Users/rai/Documents/GitHub/validation-app/frontend
ls -la node_modules | head -10
```

If `node_modules` is empty or missing, run `npm install` again.

### Quick Fix Command

Run this to install dependencies and start the server:

```bash
cd /Users/rai/Documents/GitHub/validation-app/frontend
npm install && npm run dev
```

## Verify Installation

After installing, verify vite is available:

```bash
cd /Users/rai/Documents/GitHub/validation-app/frontend
npx vite --version
```

Or check if it's in node_modules:

```bash
ls node_modules/.bin/vite
```

## Start Frontend

Once dependencies are installed:

```bash
cd /Users/rai/Documents/GitHub/validation-app/frontend
npm run dev
```

The frontend should start on http://localhost:3000

