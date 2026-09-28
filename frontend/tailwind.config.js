/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        recall: {
          bg: '#faf8fd',
          surface: '#ffffff',
          card: '#ffffff',
          border: '#ede8f8',
          borderStrong: '#d8ccee',
          accent: '#7c3aed',
          accentHover: '#6d28d9',
          lavenderSoft: '#f5f0fd',
          lavenderMid: '#e8dcfa',
          lavenderDark: '#4c1d95',
          warning: '#d97706',
          danger: '#dc2626',
          success: '#16a34a',
          memory: '#9333ea'
        }
      }
    }
  },
  plugins: []
};
