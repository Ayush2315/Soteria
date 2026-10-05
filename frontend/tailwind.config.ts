import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#f8fafc",
        "on-background": "#0f172a",
        surface: "#ffffff",
        "on-surface": "#0f172a",
        "surface-container": "#ffffff",
        "surface-container-low": "#f8fafc",
        "surface-container-high": "#f1f5f9",
        "surface-container-lowest": "#ffffff",
        "surface-variant": "#f1f5f9",
        "on-surface-variant": "#64748b",
        "outline-variant": "#e2e8f0",
        outline: "#cbd5e1",
        primary: {
          DEFAULT: "#0f172a",
          container: "#f1f5f9",
          dim: "#475569",
        },
        "on-primary": "#ffffff",
        error: {
          DEFAULT: "#e11d48",
          container: "#ffe4e6",
        },
        "on-error": "#ffffff",
        triage: {
          critical: "#e11d48", // Rose 600
          urgent: "#f59e0b",   // Amber 500
          moderate: "#0ea5e9", // Sky 500
          low: "#10b981",      // Emerald 500
        },
        soteria: {
          primary: "#0f172a",
          accent: "#2563eb",
          slate: "#64748b",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "ping-slow": "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
