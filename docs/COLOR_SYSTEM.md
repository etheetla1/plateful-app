# 🎨 Plateful Color System

## Single Source of Truth (10 Colors Total)

All colors are defined in `packages/shared/src/theme/colors.ts` and should be referenced as variables, never hardcoded.

### Primary Colors (3)
```typescript
primary: '#73d9c1'        // Mint - main actions, branding
secondary: '#707b82'      // Slate Gray - CTAs, highlights  
accent: '#4a8d8f'         // Teal - icons, success
```

### Background Colors (2)
```typescript
background: '#F8F9F7'     // Neutral soft gray - main background
surface: '#FFFFFF'        // White - cards, surfaces
```

### Text Colors (2)
```typescript
textPrimary: '#2F2F2F'    // Dark neutral - main text
textSecondary: '#666666'  // Medium gray - secondary text
```

### Chat Colors (2)
```typescript
userBubble: '#D7F4E5'     // Pale mint tone - user messages
botBubble: '#FFFFFF'      // Clean white - bot messages
```

### Utility Colors (1)
```typescript
border: '#E0E0E0'         // Light gray - borders, dividers
```

## Semantic Colors (Auto-mapped)
```typescript
success: primary          // Mint for success
error: '#F44336'          // Red for errors
warning: secondary        // Slate gray for warnings
info: '#64B5F6'           // Blue for info
disabled: '#999999'       // Gray for disabled states
```

## Usage

### ✅ Correct - Using Variables
```typescript
import { allColors as colors } from '@plateful/shared';

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    color: colors.surface,
  }
});
```

### ❌ Wrong - Hardcoded Colors
```typescript
const styles = StyleSheet.create({
  button: {
    backgroundColor: '#FF7043',  // Don't do this!
    color: '#FFFFFF',            // Don't do this!
  }
});
```

## Files Updated

- ✅ `packages/shared/src/theme/colors.ts` - **SINGLE SOURCE OF TRUTH**
- ✅ `apps/mobile/theme/colors.ts` - Re-exports from shared
- ✅ `apps/mobile/src/constants/colors.ts` - Re-exports from shared
- ✅ `packages/ui/src/components/Button.tsx` - Uses shared colors
- ✅ `packages/ui/src/components/Input.tsx` - Uses shared colors  
- ✅ `apps/mobile/app/(tabs)/chat.tsx` - Uses shared colors
- ✅ `apps/mobile/app/(tabs)/_layout.tsx` - Uses shared colors

## To Change Colors

1. Edit **ONLY** `packages/shared/src/theme/colors.ts`
2. Update the hex values
3. **All components automatically use the new colors**

## Color Philosophy

- **Fresh & Modern**: Mint provides a clean, fresh feel
- **Sophisticated CTAs**: Slate gray creates professional action buttons
- **Balanced Accents**: Teal adds depth and sophistication
- **Gender-Neutral**: Works for all users
- **Accessible**: Good contrast ratios
- **Minimal**: Only 10 colors total for consistency
