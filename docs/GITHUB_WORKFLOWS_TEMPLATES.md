# GitHub Actions Workflow Templates

These are the exact workflow files you need to create in your repository.

## 📁 File Structure

Create these files in your repository:

```
.github/
└── workflows/
    ├── mobile-cicd.yml
    └── mobile-feature.yml
```

## 📄 Workflow Files

### 1. Main CI/CD Workflow

**File:** `.github/workflows/mobile-cicd.yml`

```yaml
name: Mobile CI/CD Pipeline

on:
  push:
    branches: [main, develop]
    paths:
      - 'apps/mobile/**'
      - 'packages/**'
      - '.github/workflows/mobile-cicd.yml'
  pull_request:
    branches: [main, develop]
    paths:
      - 'apps/mobile/**'
      - 'packages/**'

jobs:
  test:
    name: Run Tests
    runs-on: ubuntu-latest
    steps:
      - name: 🏗 Setup repo
        uses: actions/checkout@v4

      - name: 🏗 Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 18.x
          cache: npm

      - name: 📦 Install dependencies
        run: npm ci

      - name: 🧪 Run tests
        run: |
          npm run test --workspace=packages/shared --if-present
          npm run type-check --workspace=apps/mobile

      - name: 🔍 Lint code
        run: |
          npm run lint --workspace=apps/mobile --if-present

  build-preview:
    name: EAS Build (Preview)
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/develop' && github.event_name == 'push'
    steps:
      - name: 🏗 Setup repo
        uses: actions/checkout@v4

      - name: 🏗 Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 18.x
          cache: npm

      - name: 🏗 Setup EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: 📦 Install dependencies
        run: npm ci

      - name: 🚀 Build on EAS
        run: |
          cd apps/mobile
          eas build --platform android --profile preview --non-interactive --no-wait
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}

      - name: 💬 Comment on commit
        uses: actions/github-script@v7
        with:
          script: |
            const { owner, repo } = context.repo;
            const sha = context.sha;
            
            await github.rest.repos.createCommitComment({
              owner,
              repo,
              commit_sha: sha,
              body: '🚀 Preview build started! Check EAS dashboard for progress.'
            });

  build-production:
    name: EAS Build (Production)
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    steps:
      - name: 🏗 Setup repo
        uses: actions/checkout@v4

      - name: 🏗 Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 18.x
          cache: npm

      - name: 🏗 Setup EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: 📦 Install dependencies
        run: npm ci

      - name: 🚀 Build on EAS
        run: |
          cd apps/mobile
          eas build --platform android --profile production --non-interactive --no-wait
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}

      - name: 💬 Comment on commit
        uses: actions/github-script@v7
        with:
          script: |
            const { owner, repo } = context.repo;
            const sha = context.sha;
            
            await github.rest.repos.createCommitComment({
              owner,
              repo,
              commit_sha: sha,
              body: '🚀 Production build started! Will auto-submit to Play Store when complete.'
            });

  submit-production:
    name: Submit to Play Store
    runs-on: ubuntu-latest
    needs: build-production
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    steps:
      - name: 🏗 Setup repo
        uses: actions/checkout@v4

      - name: 🏗 Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 18.x
          cache: npm

      - name: 🏗 Setup EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: 📦 Install dependencies
        run: npm ci

      - name: ⏳ Wait for build completion
        run: |
          cd apps/mobile
          echo "Waiting for production build to complete..."
          sleep 300  # Wait 5 minutes for build to start processing
          
          # Get the latest build ID
          BUILD_ID=$(eas build:list --platform android --status finished --limit 1 --json | jq -r '.[0].id')
          echo "Latest build ID: $BUILD_ID"
          
          # Wait for build to complete (max 30 minutes)
          timeout 1800 bash -c 'while [[ "$(eas build:view $BUILD_ID --json | jq -r ".status")" != "finished" ]]; do echo "Build still in progress..."; sleep 60; done'
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}

      - name: 🚀 Submit to Play Store
        run: |
          cd apps/mobile
          eas submit --platform android --profile production --non-interactive --latest
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}

      - name: 💬 Comment on success
        uses: actions/github-script@v7
        if: success()
        with:
          script: |
            const { owner, repo } = context.repo;
            const sha = context.sha;
            
            await github.rest.repos.createCommitComment({
              owner,
              repo,
              commit_sha: sha,
              body: '✅ Production build completed and submitted to Play Store!'
            });

      - name: 💬 Comment on failure
        uses: actions/github-script@v7
        if: failure()
        with:
          script: |
            const { owner, repo } = context.repo;
            const sha = context.sha;
            
            await github.rest.repos.createCommitComment({
              owner,
              repo,
              commit_sha: sha,
              body: '❌ Production build or submission failed. Check the Actions logs for details.'
            });
```

### 2. Feature Branch Workflow

**File:** `.github/workflows/mobile-feature.yml`

```yaml
name: Mobile Feature Branch

on:
  push:
    branches:
      - 'feature/**'
      - 'fix/**'
      - 'hotfix/**'
    paths:
      - 'apps/mobile/**'
      - 'packages/**'
  pull_request:
    branches: [main, develop]
    paths:
      - 'apps/mobile/**'
      - 'packages/**'

jobs:
  test:
    name: Run Tests
    runs-on: ubuntu-latest
    steps:
      - name: 🏗 Setup repo
        uses: actions/checkout@v4

      - name: 🏗 Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 18.x
          cache: npm

      - name: 📦 Install dependencies
        run: npm ci

      - name: 🧪 Run tests
        run: |
          npm run test --workspace=packages/shared --if-present
          npm run type-check --workspace=apps/mobile

      - name: 🔍 Lint code
        run: |
          npm run lint --workspace=apps/mobile --if-present

  build-check:
    name: Build Check
    runs-on: ubuntu-latest
    needs: test
    steps:
      - name: 🏗 Setup repo
        uses: actions/checkout@v4

      - name: 🏗 Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 18.x
          cache: npm

      - name: 📦 Install dependencies
        run: npm ci

      - name: 🔨 Check build
        run: |
          cd apps/mobile
          npm run build --if-present || echo "No build script found, checking TypeScript compilation"
          npx tsc --noEmit

      - name: 💬 Comment PR
        uses: actions/github-script@v7
        if: github.event_name == 'pull_request'
        with:
          script: |
            const { owner, repo } = context.repo;
            const issue_number = context.issue.number;
            
            await github.rest.issues.createComment({
              owner,
              repo,
              issue_number,
              body: '✅ Mobile app build check passed! Ready for EAS build when merged to develop/main.'
            });

      - name: 💬 Comment push
        uses: actions/github-script@v7
        if: github.event_name == 'push'
        with:
          script: |
            const { owner, repo } = context.repo;
            const sha = context.sha;
            
            await github.rest.repos.createCommitComment({
              owner,
              repo,
              commit_sha: sha,
              body: '✅ Feature branch tests passed! Merge to develop for preview build or main for production.'
            });

  manual-build:
    name: Manual EAS Build (Optional)
    runs-on: ubuntu-latest
    needs: [test, build-check]
    if: github.event_name == 'push' && contains(github.event.head_commit.message, '[build]')
    steps:
      - name: 🏗 Setup repo
        uses: actions/checkout@v4

      - name: 🏗 Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 18.x
          cache: npm

      - name: 🏗 Setup EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: 📦 Install dependencies
        run: npm ci

      - name: 🚀 Manual Build on EAS
        run: |
          cd apps/mobile
          eas build --platform android --profile development --non-interactive --no-wait
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}

      - name: 💬 Comment on manual build
        uses: actions/github-script@v7
        with:
          script: |
            const { owner, repo } = context.repo;
            const sha = context.sha;
            
            await github.rest.repos.createCommitComment({
              owner,
              repo,
              commit_sha: sha,
              body: '🔨 Manual development build triggered! Check EAS dashboard for progress.'
            });
```

## 🔧 Setup Instructions

### 1. Create the workflow files

```bash
# Create the directories
mkdir -p .github/workflows

# Create the main CI/CD workflow
# Copy the content from "Main CI/CD Workflow" above into this file:
touch .github/workflows/mobile-cicd.yml

# Create the feature branch workflow  
# Copy the content from "Feature Branch Workflow" above into this file:
touch .github/workflows/mobile-feature.yml
```

### 2. Add GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add this secret:
- **Name:** `EXPO_TOKEN`
- **Value:** [Your Expo access token from `eas token:create`]

### 3. Commit and push

```bash
git add .github/
git commit -m "feat: add mobile CI/CD workflows"
git push origin main
```

## 🎯 Workflow Features

### Smart Triggering
- Only runs when mobile app or shared packages change
- Different workflows for different branch types
- Manual build option with `[build]` in commit message

### Build Optimization
- Caches Node.js dependencies
- Runs tests before builds
- Non-blocking builds (--no-wait)
- Conditional builds based on branch

### Notifications
- Comments on commits with build status
- Comments on PRs with test results
- Clear success/failure messaging

### Error Handling
- Graceful failure handling
- Detailed error reporting
- Timeout protection for long builds

## 🚀 Testing Your Workflows

### Test Feature Branch
```bash
git checkout -b feature/test-workflows
echo "// Test change" >> apps/mobile/app/index.tsx
git add . && git commit -m "test: workflow setup"
git push origin feature/test-workflows
```

### Test Manual Build
```bash
git commit -m "test: manual build trigger [build]"
git push origin feature/test-workflows
```

### Test Production Pipeline
```bash
git checkout main
git merge feature/test-workflows
git push origin main
```

Your CI/CD pipeline is now ready to automate your mobile app deployments!