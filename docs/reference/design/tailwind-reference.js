/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        samrita: {
          charcoal: '#244557', // Charcoal Blue
          teal: '#376c6f',     // Stormy Teal
          spruce: '#2f4f31',   // Dark Spruce
          fern: '#537a5a',     // Fern
          iron: '#484d48',     // Iron Grey
        }
      },
      boxShadow: {
        // Creates the hard, unblurred 3D bottom edge seen in the reference image
        'stacked': '0 6px 0 0 var(--tw-shadow-color)',
        'stacked-sm': '0 4px 0 0 var(--tw-shadow-color)',
      }
    },
  },
  plugins: [],
};