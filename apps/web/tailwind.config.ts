import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        paper: "#F8FAFC",
        cobalt: "#2563EB",
        amber: "#F97316",
        mint: "#14B8A6"
      }
    }
  },
  plugins: []
};

export default config;

