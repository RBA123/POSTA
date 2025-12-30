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
          DEFAULT: '#F97316',
          300: '#FFA366',
          400: '#FF9F5A',
          500: '#F97316',
          foreground: '#FFFFFF',
        },
        // Backgrounds
        background: '#FAFAFA',
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#1A1A1A',
        },
        // Text
        foreground: '#1A1A1A',
        // Borders
        border: '#E5E5E5',
        input: '#E5E5E5',
        ring: '#F97316',
        // Secondary/Neutral
        secondary: {
          DEFAULT: '#F5F5F5',
          foreground: '#404040',
        },
        // Success (Green)
        success: {
          DEFAULT: '#22C55E',
          foreground: '#FFFFFF',
        },
        // Destructive (Red)
        destructive: {
          DEFAULT: '#EF4444',
          foreground: '#FFFFFF',
        },
        // Muted
        muted: {
          DEFAULT: '#F5F5F5',
          foreground: '#737373',
        },
        // Accent
        accent: {
          DEFAULT: '#F97316',
          foreground: '#FFFFFF',
        },
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

