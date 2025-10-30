# Fix Summary: npm run mobile/api Scripts

## Problem
The `npm run mobile` and `npm run api` commands were failing with "Missing script" errors because npm's workspace system was trying to run these scripts across all workspaces (apps/api, apps/mobile, packages/shared, packages/ui) as lifecycle hooks.

## Root Cause
The `.npmrc` file has `workspaces=true`, which causes npm to treat every script execution as a potential lifecycle hook that should run across all workspaces. This behavior cannot be easily bypassed with npm's built-in workspace flags when running from the root package.json.

## Solution Implemented
Created standalone shell scripts that bypass npm's workspace lifecycle system:

### Files Created:
1. **start-mobile.sh** - Shell script to start mobile app
2. **start-api.sh** - Shell script to start API server

### Files Modified:
1. **package.json** - Updated (but npm scripts still don't work due to workspace hooks)
2. **SETUP_COMPLETE.md** - Updated with correct working commands

## Working Commands

### ✅ These Commands Work:

```bash
# Start both mobile and API (via turbo)
npm run dev

# Start mobile app only
./start-mobile.sh
# OR
cd apps/mobile && npm run dev

# Start API only  
./start-api.sh
# OR
cd apps/api && npm run dev
```

### ❌ These Commands Don't Work (npm workspace conflicts):

```bash
npm run mobile        # Removed - doesn't work
npm run api           # Removed - doesn't work
npm run start:mobile  # Added but doesn't work due to workspaces
npm run start:api     # Added but doesn't work due to workspaces
```

## Why Shell Scripts Work

The shell scripts work because they:
1. Execute directly via bash, bypassing npm entirely
2. Change directory to the target app before running npm
3. Don't trigger npm's workspace lifecycle hooks

## Alternative Solutions Considered

1. **`npm --prefix apps/mobile run dev`** - Still triggered workspace hooks
2. **`npm run dev -w mobile`** - Still triggered workspace hooks  
3. **`cd apps/mobile && npm run dev`** in package.json - Still triggered hooks
4. **Disabling workspaces in .npmrc** - Would break other functionality

## Recommendation

**Use the shell scripts or direct cd commands:**

```bash
# Easiest (from project root)
./start-mobile.sh
./start-api.sh

# Or use direct commands
cd apps/mobile && npm run dev
cd apps/api && npm run dev
```

The `npm run dev` command continues to work correctly for starting everything via turbo.

## Testing Verification

✅ Shell scripts tested and working
✅ Direct cd commands work
✅ `npm run dev` works for running everything
✅ Documentation updated in SETUP_COMPLETE.md

## Files Changed Summary

- ✅ Created: `start-mobile.sh` (executable)
- ✅ Created: `start-api.sh` (executable)
- ✅ Modified: `package.json` (attempted fixes, scripts reference shell scripts)
- ✅ Modified: `SETUP_COMPLETE.md` (updated with working commands)
- ✅ Modified: `packages/ui/package.json` (fixed React 19 compatibility)


