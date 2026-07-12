/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#dce8ff',
          200: '#bcd2ff',
          300: '#8fb4ff',
          400: '#5b8cff',
          500: '#3366ff',
          600: '#2447e8',
          700: '#1e37bd',
          800: '#1d3397',
          900: '#1e3079',
        },
        violet2: {
          500: '#7c3aed',
          600: '#6d28d9',
          700: '#5b21b6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 10px 30px -12px rgba(59, 73, 223, 0.25)',
        glow: '0 0 40px rgba(124, 58, 237, 0.35)',
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #3366ff 0%, #7c3aed 100%)',
        'gradient-soft': 'linear-gradient(135deg, #eef4ff 0%, #f5ecff 100%)',
      },
    },
  },
  plugins: [],
};
