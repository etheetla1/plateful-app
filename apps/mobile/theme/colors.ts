// Plateful Design System Colors - from Figma
export const colors = {
  // Primary - Orange (main actions, branding)
  primary: '#FF9800',
  primaryLight: '#FFB74D',
  primaryDark: '#F57C00',
  
  // Secondary - Blue (secondary actions, links)
  secondary: '#64B5F6',
  secondaryLight: '#90CAF9',
  secondaryDark: '#42A5F5',
  
  // Backgrounds
  background: '#F5F5F5',
  surface: '#FFFFFF',
  
  // Text
  textPrimary: '#212121',
  textSecondary: '#757575',
  textDisabled: '#BDBDBD',
  
  // UI Elements
  border: '#E0E0E0',
  divider: '#EEEEEE',
  
  // Status
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FF9800',
  info: '#2196F3',
  
  // Overlays
  overlay: 'rgba(0, 0, 0, 0.5)',
  scrim: 'rgba(0, 0, 0, 0.32)',
};

export type ColorKey = keyof typeof colors;
