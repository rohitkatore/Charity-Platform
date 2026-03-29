/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        app: "var(--bg-0)",
        surface: {
          300: "var(--surface-300)",
          200: "var(--surface-200)",
        },
        brand: {
          600: "var(--brand-600)",
          500: "var(--brand-500)",
          300: "var(--brand-300)",
        },
      },
      backgroundImage: {
        app: "linear-gradient(170deg, var(--bg-0), var(--bg-1), var(--bg-2))",
      },
    },
  },
  plugins: [],
};

