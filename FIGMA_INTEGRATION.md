# Figma Integration Guide

This document explains how to integrate Figma designs with your Plateful codebase, enabling automatic extraction of design tokens and assets.

## 📋 Table of Contents

- [Setup](#setup)
- [Configuration](#configuration)
- [Usage](#usage)
- [Design Tokens](#design-tokens)
- [Assets](#assets)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## 🚀 Setup

### 1. Get Figma Access Token

1. Go to [Figma Settings](https://www.figma.com/settings)
2. Scroll to **Personal access tokens**
3. Click **Generate new token**
4. Name it: `Plateful Development`
5. Select these scopes:
   - ✅ File content: read
   - ✅ File metadata: read
   - ✅ Library assets: read
   - ✅ Library content: read
6. Click **Generate token**
7. **Copy the token immediately** (it won't be shown again!)

### 2. Get Figma File ID

1. Open your Figma design file
2. Look at the URL:
   ```
   https://www.figma.com/file/ABC123xyz/Plateful-Design
                              ↑↑↑↑↑↑↑↑↑
                              This is your File ID
   ```
3. Copy the File ID (the part between `/file/` and the next `/`)

### 3. Configure Environment Variables

1. Open the `.env` file in the project root
2. Add your credentials:

```env
# Figma Integration
FIGMA_ACCESS_TOKEN=figd_your_token_here
FIGMA_FILE_ID=ABC123xyz
```

**Security Note:** The `.env` file is already in `.gitignore` and won't be committed to Git.

## ⚙️ Configuration

Your Figma integration is configured with:

- **Design Tokens Output**: `apps/mobile/theme/`
- **Assets Output**: `apps/mobile/assets/figma/`
- **Cache Directory**: `tools/figma/.cache/`

All output directories are automatically created when you run sync scripts.

## 📦 Usage

### Sync Everything

Sync both design tokens and assets:

```bash
pnpm figma:sync
```

This runs both token extraction and asset downloads in sequence.

### Extract Design Tokens Only

Extract colors, typography, spacing, shadows, and border radii:

```bash
pnpm figma:tokens
```

**Output:** `apps/mobile/theme/`
- `colors.ts` - Color palette
- `typography.ts` - Text styles
- `spacing.ts` - Padding and margins
- `shadows.ts` - Drop shadows
- `radii.ts` - Border radius values
- `index.ts` - Exports all tokens

### Download Assets Only

Download icons, images, logos, and component previews:

```bash
pnpm figma:assets
```

**Output:** `apps/mobile/assets/figma/`
- `icons/` - Icon exports
- `images/` - Image exports
- `logos/` - Logo exports
- `components/` - Component previews

## 🎨 Design Tokens

### Using Design Tokens in Code

```typescript
import { colors, typography, spacing, shadows, radii } from '@/theme';

// Use colors
<View style={{ backgroundColor: colors['primary'] }} />

// Use typography
<Text style={{ 
  fontSize: typography['heading-1'].fontSize,
  fontWeight: typography['heading-1'].fontWeight
}} />

// Use spacing
<View style={{ padding: spacing['container'].paddingTop }} />

// Use shadows
<View style={{ 
  shadowOffset: { 
    width: shadows['card-0'].offsetX, 
    height: shadows['card-0'].offsetY 
  },
  shadowRadius: shadows['card-0'].radius
}} />

// Use border radius
<View style={{ borderRadius: radii['button'] }} />
```

### How Tokens Are Extracted

1. **Colors**: Extracted from color styles and fill colors throughout the document
2. **Typography**: Extracted from text layers with their font properties
3. **Spacing**: Extracted from padding properties of frames
4. **Shadows**: Extracted from drop shadow effects
5. **Radii**: Extracted from corner radius properties

### Naming Conventions in Figma

For best results, use descriptive names in Figma:

**Colors:**
- `primary`, `secondary`, `accent`
- `text-primary`, `text-secondary`
- `background`, `surface`, `border`

**Typography:**
- `heading-1`, `heading-2`, `heading-3`
- `body-large`, `body-small`
- `caption`, `label`

**Component names are automatically converted:**
- `Primary Button` → `primary-button`
- `Text/Heading 1` → `text-heading-1`
- `Colors/Primary` → `colors-primary`

## 🖼️ Assets

### Naming Assets in Figma

To export assets, use these naming prefixes:

**Icons:**
```
icon/home
icon/search
icon/user-profile
```

**Images:**
```
image/hero-banner
image/onboarding-1
image/empty-state
```

**Logos:**
```
logo/plateful-full
logo/plateful-icon
logo/plateful-wordmark
```

**Manual Export Tag:**
```
Button Component [export]
Header Design [export]
```

### Using Assets in React Native

```typescript
import { Image } from 'react-native';

// Use Figma-exported assets
<Image 
  source={require('@/assets/figma/icons/home.png')} 
  style={{ width: 24, height: 24 }}
/>

<Image 
  source={require('@/assets/figma/logos/plateful-full.png')} 
  style={{ width: 120, height: 40 }}
/>
```

### Asset Export Settings

- **Format**: PNG
- **Scale**: 2x (for @2x resolution)
- **Batch Size**: 50 assets per batch (to respect API rate limits)

## 💡 Best Practices

### 1. Organize Your Figma File

Create dedicated pages/frames for:
- **Design System** - Colors, typography, spacing tokens
- **Components** - Reusable UI components
- **Assets** - Icons, illustrations, images to export

### 2. Use Figma Styles

Create Figma styles for:
- Colors (creates named color tokens)
- Text styles (creates typography tokens)
- Effects (creates shadow tokens)

### 3. Consistent Naming

Use consistent, hierarchical naming:
- Use `/` for hierarchy: `Colors/Primary/500`
- Use `-` for spaces: `icon-home-filled`
- Keep names lowercase
- Be descriptive but concise

### 4. Regular Syncing

Sync after design changes:
```bash
# After updating designs
pnpm figma:sync

# Commit the generated files
git add apps/mobile/theme apps/mobile/assets/figma
git commit -m "chore: sync Figma design system"
```

### 5. Version Control

✅ **Commit these generated files:**
- `apps/mobile/theme/*` - Design tokens
- `apps/mobile/assets/figma/*` - Exported assets

❌ **Don't commit:**
- `tools/figma/.cache/` - Temporary cache
- `.env` - Contains your Figma token

## 🔧 Troubleshooting

### Error: "FIGMA_ACCESS_TOKEN is required"

**Solution:** Make sure you've added your token to `.env`:
```env
FIGMA_ACCESS_TOKEN=figd_your_actual_token_here
```

### Error: "Invalid Figma access token"

**Solutions:**
1. Check that the token is correct (no extra spaces)
2. Verify the token hasn't expired
3. Generate a new token with correct scopes

### Error: "Figma file not found"

**Solutions:**
1. Verify the File ID is correct
2. Make sure your token has access to this file
3. Check that the file isn't in a private team you don't have access to

### No Assets Found

**Solutions:**
1. Make sure nodes are named with correct prefixes (`icon/`, `image/`, `logo/`)
2. Or add `[export]` tag to any node name
3. Check that nodes are visible (not hidden)

### Some Colors/Tokens Missing

**Solutions:**
1. Ensure you've created Figma styles for colors and text
2. Check that layers have descriptive names
3. Verify layers are visible and not locked

### Rate Limiting Errors

**Solution:** The scripts already handle rate limiting with batch processing and delays. If you still hit limits:
1. Reduce the number of assets being exported
2. Wait a few minutes before trying again

## 🔄 Workflow Integration

### Recommended Workflow

1. **Design in Figma** - Create or update designs
2. **Sync to Code** - Run `pnpm figma:sync`
3. **Review Changes** - Check generated files
4. **Use in Components** - Import and use tokens/assets
5. **Commit** - Commit the generated files
6. **Repeat** - Sync again when designs change

### CI/CD Integration

You can add Figma sync to your CI/CD pipeline:

```yaml
# .github/workflows/sync-figma.yml
name: Sync Figma
on:
  schedule:
    - cron: '0 0 * * *' # Daily at midnight
  workflow_dispatch: # Manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: pnpm install
      - run: pnpm figma:sync
        env:
          FIGMA_ACCESS_TOKEN: ${{ secrets.FIGMA_ACCESS_TOKEN }}
          FIGMA_FILE_ID: ${{ secrets.FIGMA_FILE_ID }}
      - uses: peter-evans/create-pull-request@v5
        with:
          title: 'chore: sync Figma design system'
```

## 📚 Additional Resources

- [Figma API Documentation](https://www.figma.com/developers/api)
- [Figma Access Tokens](https://help.figma.com/hc/en-us/articles/8085703771159-Manage-personal-access-tokens)
- [React Native Image Guide](https://reactnative.dev/docs/images)

## 🆘 Need Help?

If you encounter issues not covered here:

1. Check the console output for detailed error messages
2. Verify your Figma file structure and naming
3. Test with a simple Figma file first
4. Check the Figma API status page

---

**Happy designing! 🎨**
