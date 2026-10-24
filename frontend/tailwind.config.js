/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
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
