/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ✅ Couleur principale Bordeaux
        primary: {
          50: "#fdf2f2",
          100: "#fce8e8",
          200: "#fbd5d5",
          300: "#f8b4b4",
          400: "#f98080",
          500: "#f56565",
          600: "#e53e3e",
          700: "#c53030",
          800: "#800020", // 🍷 Bordeaux principal
          900: "#5c1a1a",
          950: "#2d0a0a",
        },
        bordeaux: {
          50: "#fdf2f2",
          100: "#fce8e8",
          200: "#fbd5d5",
          300: "#f8b4b4",
          400: "#f98080",
          500: "#f56565",
          600: "#e53e3e",
          700: "#c53030",
          800: "#800020", // 🍷 Bordeaux principal
          900: "#5c1a1a",
          950: "#2d0a0a",
        },
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-in": "slideIn 0.3s ease-in-out",
        "pulse-bordeaux": "pulseBordeaux 2s infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideIn: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        pulseBordeaux: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(128, 0, 32, 0.7)" },
          "50%": { boxShadow: "0 0 0 10px rgba(128, 0, 32, 0)" },
        },
      },
    },
  },
  plugins: [],
};
