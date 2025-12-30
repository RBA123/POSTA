/**
 * Liberta Color System
 * 
 * A centralized color palette for consistent theming across the app.
 * All colors should be referenced from this file to maintain consistency.
 */

const Colors = {
  // Primary (Orange) - Main brand color
  primary500: '#F97316',      // Main orange - buttons, accents, active states
  primary400: '#FF9F5A',      // Light orange - gradients, hover states
  primary300: '#FFA366',      // Lighter orange variant
  
  // Background & Surface
  background: '#FAFAFA',      // Main background (hsl(0, 0%, 98%))
  card: '#FFFFFF',            // Card backgrounds, modals
  
  // Text Colors
  foreground: '#1A1A1A',      // Primary text (hsl(220, 20%, 10%))
  foregroundMuted: '#737373', // Secondary text (hsl(220, 10%, 50%))
  
  // Borders & Dividers
  border: '#E5E5E5',          // Borders, dividers (hsl(220, 13%, 91%))
  
  // Secondary/Neutral
  secondary: '#F5F5F5',       // Secondary backgrounds (hsl(220, 14%, 96%))
  secondaryForeground: '#404040', // Text on secondary backgrounds
  
  // Success (Green) - "Sí" bets, wins, positive states
  success: '#22C55E',         // Main green (hsl(142, 76%, 36%))
  successLight: '#22C55E1A',  // 10% opacity for backgrounds
  
  // Destructive (Red) - "No" bets, losses, errors
  destructive: '#EF4444',     // Main red (hsl(0, 84%, 60%))
  destructiveLight: '#EF44441A', // 10% opacity for backgrounds
  
  // Utility Colors
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  
  // Overlay
  overlay: '#00000066',       // 40% black for modal backgrounds
} as const;

export default Colors;

