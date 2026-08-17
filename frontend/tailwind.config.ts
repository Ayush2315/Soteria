import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#090D16",
        surface: {
          50: "#1E293B",
          100: "#172033",
          200: "#0F172A",
          300: "#0B1120",
        },
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
        }
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
