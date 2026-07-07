import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bank: {
          DEFAULT: "#00843D",
          dark: "#005A35",
          emerald: "#063F35",
          navy: "#071827",
          soft: "#E8F7EF",
          mist: "#F3FBF8"
        },
        border: "#DDE7E3",
        background: "#F6FAFC",
        foreground: "#0F172A",
        muted: "#64748B"
      },
      boxShadow: {
        drawer: "-24px 0 60px rgba(15, 23, 42, 0.18)",
        glass: "0 18px 45px rgba(15, 23, 42, 0.08)",
        lift: "0 12px 28px rgba(0, 90, 53, 0.12)"
      }
    }
  },
  plugins: []
} satisfies Config;
