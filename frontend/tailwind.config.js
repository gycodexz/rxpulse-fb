/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eef7fd',
          100: '#d9edfa',
          200: '#b3dbf5',
          300: '#7cc0ec',
          400: '#3f9fdc',
          500: '#1477c4',
          600: '#0b5fa5',
          700: '#0a4c85',
          800: '#0c3f6c',
          900: '#0a2a43',
          950: '#071b2c',
        },
        accent: '#2fb6d9',
      },
      boxShadow: {
        card: '0 1px 2px rgba(10,42,67,0.06), 0 4px 16px rgba(10,42,67,0.06)',
      },
    },
  },
  plugins: [],
}
