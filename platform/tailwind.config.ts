import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: "#1A1A17",
          accent: "#1B6B4A",
          "accent-hover": "#155A3E",
          green: "#16A34A",
          orange: "#B45309",
          red: "#DC2626",
          surface: "#FDFCFA",
          bg: "#F8F7F4",
          muted: "#5C5C56",
          sidebar: "#111110",
        },
      },
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
