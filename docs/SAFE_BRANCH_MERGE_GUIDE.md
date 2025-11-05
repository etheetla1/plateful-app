# Safe Branch Merge Guide

## 🎯 Objective
Merge another developer's branch with new features while preserving all CI/CD pipeline work and EAS configuration.

## 📋 Pre-Merge Checklist

### 1. Current Status Verification ✅
- [x] EAS build fixes applied
- [x] Package ID mismatch resolved
- [x] Workspace dependencies built
- [x] Turbo configuration fixed
- [🔄] EAS build currently running

### 2. Critical Files to Preserve
These files contain our CI/CD work and must NOT be overwritten:

**GitHub Actions:**
- `.github/workflows/mobile-cicd.yml`
- `.github/workflows/mobile-feature.yml`

**EAS Configuration:**
- `apps/mobile/eas.json`
- `apps/mobile/app.json` (especially package IDs)

**Build Configuration:**
- `turbo.json`
- `package.json` (workspace configuration)
- `packages/shared/dist/` (built files)
- `packages/ui/dist/` (built files)

**Documentation:**
- `docs/ANDROID_PLAY_STORE_DEPLOYMENT_GUIDE.md`
- `docs/CICD_QUICK_SETUP.md`
- `docs/EAS_BUILD_FIXES_APPLIED.md`
- All other deployment docs

## 🔄 Step-by-Step Merge Process

### Step 1: Backup Current Work
```bash
# Ensure all changes are committed
git add .
git commit -m "checkpoint: save all CI/CD work before merge"
git push origin develop

# Create backup branch
git checkout -b backup-cicd-work
git push origin backup-cicd-work
```

### Step 2: Prepare for Merge
```bash
# Switch to main branch
git checkout main
git pull origin main

# Merge our develop branch first
git merge develop --no-ff -m "feat: add complete CI/CD pipeline and EAS configuration"
git push origin main
```

### Step 3: Identify Other Developer's Branch
```bash
# List all remote branches
git branch -r

# Fetch latest changes
git fetch origin

# Check what branch has the new features
# (Replace [other-branch] with actual branch name)
git log --oneline origin/[other-branch] --not origin/main
```

### Step 4: Merge Other Developer's Work
```bash
# Merge the other developer's branch
git merge origin/[other-branch] --no-ff -m "feat: merge new features from [developer-name]"

# If conflicts occur, resolve them carefully:
# - Keep our CI/CD files (.github/, eas.json, app.json package IDs)
# - Accept their feature code changes
# - Preserve our build configuration (turbo.json, package.json workspaces)
```

### Step 5: Conflict Resolution Strategy

**If conflicts occur in critical files:**

1. **apps/mobile/app.json**
   - Keep package ID: `"package": "com.kingeli1221.plateful"`
   - Keep bundle ID: `"bundleIdentifier": "com.kingeli1221.plateful"`
   - Accept their feature additions (new permissions, plugins, etc.)

2. **package.json**
   - Keep workspaces array: `["apps/api", "apps/mobile", "packages/*"]`
   - Keep build scripts we added
   - Accept their new dependencies

3. **turbo.json**
   - Keep our `pipeline` format (not `tasks`)
   - Accept their new build targets if any

4. **Feature files**
   - Accept all their changes in `apps/mobile/app/` directory
   - Accept their new components, services, etc.

### Step 6: Post-Merge Verification
```bash
# Rebuild workspace packages
npx turbo run build

# Verify EAS configuration
cd apps/mobile
eas build --platform android --profile preview --dry-run

# Test that the app still works
npm run dev
```

### Step 7: Test and Deploy
```bash
# Push merged changes
git push origin main

# Test EAS build with new features
cd apps/mobile
eas build --platform android --profile preview

# If successful, create production build
eas build --platform android --profile production
```

## 🚨 Emergency Rollback Plan

If merge goes wrong:
```bash
# Reset to backup
git reset --hard backup-cicd-work
git push origin main --force

# Or restore specific files
git checkout backup-cicd-work -- .github/
git checkout backup-cicd-work -- apps/mobile/eas.json
git checkout backup-cicd-work -- apps/mobile/app.json
```

## 🔍 Common Merge Conflicts

### 1. Package.json Dependencies
**Resolution**: Accept both sets of dependencies, remove duplicates

### 2. App.json Configuration
**Resolution**: Keep our package IDs, merge their feature configs

### 3. New App Screens/Components
**Resolution**: Accept all their changes, they won't conflict with CI/CD

### 4. Firebase/API Configuration
**Resolution**: Keep our production API URLs, accept their feature additions

## ✅ Success Criteria

After merge, you should have:
- [x] All CI/CD workflows intact
- [x] EAS builds working
- [x] New features from other developer
- [x] Correct package IDs maintained
- [x] All documentation preserved
- [x] Workspace dependencies building

## 📞 If You Need Help

If conflicts are too complex:
1. Create a new branch: `git checkout -b merge-help`
2. Commit the conflicted state
3. Ask for assistance with specific conflict files
4. Use the backup branch to restore if needed

## 🎯 Final Goal

After successful merge:
- New features integrated ✅
- CI/CD pipeline working ✅
- EAS builds successful ✅
- Ready for Play Store submission ✅