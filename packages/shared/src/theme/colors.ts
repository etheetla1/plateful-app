// Shared Color System - Single Source of Truth
// This file should be the ONLY place where colors are defined

export const colors = {
  // Primary Colors (3)
  primary: '#73d9c1',        // Mint - main actions, branding
  secondary: '#707b82',      // Slate Gray - CTAs, highlights  
  accent: '#4a8d8f',         // Teal - icons, success
  
  // Background Colors (2)
  background: '#F8F9F7',     // Neutral soft gray - main background
  surface: '#FFFFFF',        // White - cards, surfaces
  
  // Text Colors (2)
  textPrimary: '#2F2F2F',    // Dark neutral - main text
  textSecondary: '#666666',  // Medium gray - secondary text
  
  // Chat Colors (2)
  userBubble: '#D7F4E5',     // Pale mint tone - user messages
  botBubble: '#FFFFFF',      // Clean white - bot messages
  
  // Utility Colors (1)
  border: '#E0E0E0',         // Light gray - borders, dividers
} as const;

// Semantic color mappings
export const semanticColors = {
  success: colors.primary,    // Use mint for success
  error: '#F44336',          // Keep red for errors
  warning: colors.secondary,  // Use burnt orange for warnings
  info: '#64B5F6',           // Keep blue for info
  disabled: '#999999',       // Gray for disabled states
} as const;

// Export all colors together
export const allColors = {
  ...colors,
  ...semanticColors,
} as const;

export type ColorKey = keyof typeof allColors;
