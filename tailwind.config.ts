import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--sf-bg)",
        surface: "var(--sf-surface)",
        muted: "var(--sf-surface-muted)",
        border: "var(--sf-border)",
        fg: "var(--sf-text)",
        "fg-muted": "var(--sf-text-muted)",
        accent: {
          DEFAULT: "var(--sf-accent)",
          hover: "var(--sf-accent-hover)",
          subtle: "var(--sf-accent-subtle)",
        },
        spark: "var(--sf-spark)",
        success: "var(--sf-success)",
        warning: "var(--sf-warning)",
        danger: "var(--sf-danger)",
      },
      borderRadius: {
        sm: "var(--sf-radius-sm)",
        DEFAULT: "var(--sf-radius)",
        lg: "var(--sf-radius-lg)",
      },
      fontFamily: {
        sans: ["var(--sf-font-sans)"],
        mono: ["var(--sf-font-mono)"],
      },
      boxShadow: {
        sm: "var(--sf-shadow-sm)",
        DEFAULT: "var(--sf-shadow)",
        lg: "var(--sf-shadow-lg)",
      },
    },
  },
  plugins: [],
};

export default config;
