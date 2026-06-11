import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bank: {
          DEFAULT: "#00843D",
          dark: "#006B32",
          soft: "#E8F7EF"
        },
        border: "#E5E7EB",
        background: "#FFFFFF",
        foreground: "#0F172A",
        muted: "#64748B"
      },
      boxShadow: {
        drawer: "-18px 0 40px rgba(15, 23, 42, 0.12)"
      }
    }
  },
  plugins: []
} satisfies Config;
