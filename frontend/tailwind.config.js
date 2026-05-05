/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        vf: {
          DEFAULT: '#2563eb',
          hover: '#1e40af',
          soft: '#eff6ff',
          softer: '#dbeafe',
          muted: '#bfdbfe',
        },
        accent: {
          DEFAULT: '#14b8a6',
          hover: '#0d9488',
          soft: '#f0fdfa',
        },
      },
      boxShadow: {
        'soft-sm': '0 2px 8px -2px rgba(15, 23, 42, 0.05), 0 1px 4px -1px rgba(15, 23, 42, 0.03)',
        'soft-md': '0 12px 24px -6px rgba(15, 23, 42, 0.08), 0 4px 12px -3px rgba(15, 23, 42, 0.04)',
        'soft-lg': '0 25px 50px -12px rgba(15, 23, 42, 0.12), 0 8px 24px -6px rgba(15, 23, 42, 0.06)',
      },
    },
  },
  plugins: [],
};
