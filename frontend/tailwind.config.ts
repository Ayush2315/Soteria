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
        background: "#071220",
        "on-background": "#f1f5f9",
        surface: "#0b1c30",
        "on-surface": "#f1f5f9",
        "surface-container": "#102034",
        "surface-container-low": "#081628",
        "surface-container-high": "#192d48",
        "surface-container-lowest": "#040c17",
        "surface-variant": "#1e3553",
        "on-surface-variant": "#94a3b8",
        "outline-variant": "#223854",
        outline: "#475569",
        primary: {
          DEFAULT: "#ea580c",
          container: "#c2410c",
          dim: "#fdba74",
        },
        "on-primary": "#ffffff",
        error: {
          DEFAULT: "#dc2626",
          container: "#991b1b",
        },
        "on-error": "#ffffff",
        triage: {
          critical: "#EF4444", // P1: 80 - 100
          urgent: "#F97316",   // P2: 60 - 79
          moderate: "#EAB308", // P3: 40 - 59
          low: "#10B981",      // P4: 0 - 39
        },
        soteria: {
          primary: "#3B82F6",
          accent: "#6366F1",
          cyan: "#06B6D4",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "command-grid": "linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)",
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
