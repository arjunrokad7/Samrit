/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      outlineColor: {
        samrita: { teal: "rgb(var(--sr-accent) / <alpha-value>)" },
      },
      ringColor: { samrita: { teal: "rgb(var(--sr-accent) / <alpha-value>)" } },
      backgroundColor: {
        white: "rgb(var(--sr-surface) / <alpha-value>)",
        slate: {
          50: "rgb(var(--sr-canvas) / <alpha-value>)",
          100: "rgb(var(--sr-raised) / <alpha-value>)",
          200: "rgb(var(--sr-fill) / <alpha-value>)",
        },
      },
      textColor: {
        samrita: {
          charcoal: "rgb(var(--sr-text) / <alpha-value>)",
          iron: "rgb(var(--sr-secondary) / <alpha-value>)",
          teal: "rgb(var(--sr-accent) / <alpha-value>)",
          spruce: "rgb(var(--sr-green) / <alpha-value>)",
        },
        slate: {
          400: "rgb(var(--sr-placeholder) / <alpha-value>)",
          500: "rgb(var(--sr-muted) / <alpha-value>)",
          600: "rgb(var(--sr-subtle) / <alpha-value>)",
          700: "rgb(var(--sr-secondary) / <alpha-value>)",
          800: "rgb(var(--sr-text) / <alpha-value>)",
          900: "rgb(var(--sr-text) / <alpha-value>)",
        },
      },
      borderColor: {
        slate: {
          100: "rgb(var(--sr-line-soft) / <alpha-value>)",
          200: "rgb(var(--sr-line) / <alpha-value>)",
          300: "rgb(var(--sr-line-strong) / <alpha-value>)",
        },
      },
      colors: {
        samrita: {
          charcoal: "#244557",
          teal: "#376c6f",
          spruce: "#2f4f31",
          fern: "#537a5a",
          iron: "#484d48",
        },
        slate: {
          950: "#020617",
        },
      },
      fontFamily: {
        display: ['"Lilita One"', "sans-serif"],
        body: ["Telegraf", '"PP Telegraf"', '"DM Sans"', "sans-serif"],
      },
      boxShadow: {
        stacked: "0 6px 0 0 var(--tw-shadow-color)",
        "stacked-sm": "0 4px 0 0 var(--tw-shadow-color)",
      },
    },
  },
  plugins: [],
};
