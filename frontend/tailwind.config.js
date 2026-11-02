/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          navy: "#0F172A",
          dark: "#1E293B",
          slate: "#334155",
          blue: "#1D4ED8",
          primary: "#2563EB",
          light: "#EFF6FF",
          accent: "#D97706",
          border: "#E2E8F0"
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
