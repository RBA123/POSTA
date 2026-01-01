const Colors = require("./constants/Colors").default;

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Primary (Orange)
        primary: {
          DEFAULT: Colors.primary500,
          50: Colors.primary50,
          100: Colors.primary100,
          300: Colors.primary300,
          400: Colors.primary400,
          500: Colors.primary500,
          foreground: Colors.white,
        },
        // Backgrounds
        background: Colors.background,
        card: {
          DEFAULT: Colors.card,
          foreground: Colors.foreground,
        },
        // Text
        foreground: Colors.foreground,
        // Borders
        border: Colors.border,
        input: Colors.border,
        ring: Colors.primary500,
        // Secondary/Neutral
        secondary: {
          DEFAULT: Colors.secondary,
          foreground: Colors.secondaryForeground,
        },
        // Success (Green)
        success: {
          DEFAULT: Colors.success,
          foreground: Colors.white,
          light: Colors.successLight,
        },
        // Destructive (Red)
        destructive: {
          DEFAULT: Colors.destructive,
          foreground: Colors.white,
          light: Colors.destructiveLight,
        },
        // Muted
        muted: {
          DEFAULT: Colors.secondary,
          foreground: Colors.foregroundMuted,
        },
        // Accent
        accent: {
          DEFAULT: Colors.primary500,
          foreground: Colors.white,
        },
        // Utility
        overlay: Colors.overlay,
        transparent: Colors.transparent,
      },
      borderRadius: {
        lg: "1rem",
        md: "calc(1rem - 2px)",
        sm: "calc(1rem - 4px)",
        xl: "calc(1rem + 4px)",
        "2xl": "calc(1rem + 8px)",
      },
    },
  },
  plugins: [],
};
