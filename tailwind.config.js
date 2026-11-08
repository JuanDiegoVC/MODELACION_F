/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sura: {
          blue: '#0033A0',
          cyan: '#00AEC7',
          dark: '#001E62',
          light: '#E8F4F8',
        }
      }
    },
  },
  plugins: [],
}

