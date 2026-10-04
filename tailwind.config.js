/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#f43f5e',
          500: '#e11d48',
          600: '#c60003', // Official CUCOM Red from Logo
          700: '#a80002',
          800: '#8c0002',
          900: '#730002',
          950: '#450001',
        },
        cucom: {
          red: '#c60003',
          darkred: '#990002',
          lightred: '#ffe5e6',
          border: '#fca5a5',
        },
        mint: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#f43f5e',
          500: '#c60003',
          600: '#a80002',
          700: '#8c0002',
        }
      }
    },
  },
  plugins: [],
}
