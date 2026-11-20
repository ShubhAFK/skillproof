/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0B0F17",
          surface: "#111622",
          card: "#141c2c",
          border: "#1e293b",
        },
        gold: {
          DEFAULT: "#EAB308",
          light: "#F5C451",
          dim: "rgba(234, 179, 8, 0.15)",
        },
      },
      fontFamily: {
        serif: ["Fraunces", "Georgia", "serif"],
        seal: ["Cinzel", "Times New Roman", "serif"],
        sans: ["IBM Plex Sans", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
