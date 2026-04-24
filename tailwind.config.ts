import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f7f8fa",
          100: "#eef0f4",
          200: "#dde1e9",
          300: "#c2c8d3",
          400: "#8e97a7",
          500: "#5b6477",
          600: "#3e4557",
          700: "#2c3242",
          800: "#1d2230",
          900: "#11141d",
        },
        brand: {
          50: "#eef5ff",
          100: "#d9e8ff",
          200: "#b6d2ff",
          300: "#85b2ff",
          400: "#5689ff",
          500: "#2f63f5",
          600: "#1e48d1",
          700: "#1a3aa8",
          800: "#1a3484",
          900: "#1a2e66",
        },
        ok: { 500: "#16a34a", 100: "#dcfce7" },
        warn: { 500: "#d97706", 100: "#fef3c7" },
        bad: { 500: "#dc2626", 100: "#fee2e2" },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(17, 20, 29, 0.04), 0 1px 1px rgba(17, 20, 29, 0.03)",
        pop: "0 10px 30px rgba(17, 20, 29, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
