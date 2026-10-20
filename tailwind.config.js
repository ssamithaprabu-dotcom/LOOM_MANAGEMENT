/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        glow: '0 0 0 1px rgba(34,211,238,0.15), 0 12px 35px rgba(15,23,42,0.35)',
      },
      colors: {
        panel: '#0b1220',
        panelAlt: '#111827',
        accent: '#22d3ee',
        warn: '#f59e0b',
        danger: '#ef4444',
        success: '#22c55e',
        slateish: '#94a3b8',
      },
    },
  },
  plugins: [],
};
