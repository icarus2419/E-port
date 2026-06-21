import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Poppins", "sans-serif"],
        serif: ["Libre Baskerville", "serif"],
        mono: ["IBM Plex Mono", "monospace"]
      },
      borderRadius: {
        sm: "calc(var(--radius, 0.375rem) - 2px)",
        md: "var(--radius, 0.375rem)",
        lg: "calc(var(--radius, 0.375rem) + 4px)"
      }
    }
  }
} satisfies Config;
