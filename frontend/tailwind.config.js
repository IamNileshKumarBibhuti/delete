/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "deepguard-dark": "#0b0f1f",
        "deepguard-light": "#f7f9ff",
      },
      boxShadow: {
        glow: "0 0 30px rgba(99, 102, 241, 0.35)",
      },
      backgroundImage: {
        "hero-gradient": "radial-gradient(circle at top, rgba(59, 130, 246, 0.35), transparent 55%), radial-gradient(circle at bottom, rgba(16, 185, 129, 0.28), transparent 55%)",
      },
    },
  },
  plugins: [],
};
