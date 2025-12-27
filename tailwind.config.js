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
        border: "hsl(220, 13%, 91%)",
        input: "hsl(220, 13%, 91%)",
        ring: "hsl(24, 95%, 53%)",
        background: "hsl(0, 0%, 98%)",
        foreground: "hsl(220, 20%, 10%)",
        primary: {
          DEFAULT: "hsl(24, 95%, 53%)",
          hover: "hsl(24, 95%, 45%)",
          foreground: "hsl(0, 0%, 100%)",
        },
        secondary: {
          DEFAULT: "hsl(220, 14%, 96%)",
          foreground: "hsl(220, 20%, 25%)",
        },
        destructive: {
          DEFAULT: "hsl(0, 84%, 60%)",
          foreground: "hsl(0, 0%, 100%)",
        },
        success: {
          DEFAULT: "hsl(142, 76%, 36%)",
          foreground: "hsl(0, 0%, 100%)",
        },
        muted: {
          DEFAULT: "hsl(220, 14%, 96%)",
          foreground: "hsl(220, 10%, 50%)",
        },
        accent: {
          DEFAULT: "hsl(24, 95%, 53%)",
          foreground: "hsl(0, 0%, 100%)",
        },
        card: {
          DEFAULT: "hsl(0, 0%, 100%)",
          foreground: "hsl(220, 20%, 10%)",
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

