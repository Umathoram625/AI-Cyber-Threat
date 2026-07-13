/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: '#020617',     // Slate 950
          card: '#0f172a',     // Slate 900
          border: '#1e293b',   // Slate 800
          cyan: '#06b6d4',     // Cyan 500
          emerald: '#10b981',  // Emerald 500
          amber: '#f59e0b',    // Amber 500
          red: '#ef4444',      // Red 500
          purple: '#8b5cf6',   // Purple 500
          gray: '#94a3b8',     // Slate 400
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'neon-cyan': '0 0 10px rgba(6, 182, 212, 0.15), 0 0 20px rgba(6, 182, 212, 0.05)',
        'neon-red': '0 0 10px rgba(239, 68, 68, 0.2), 0 0 20px rgba(239, 68, 68, 0.05)',
        'neon-emerald': '0 0 10px rgba(16, 185, 129, 0.2), 0 0 20px rgba(16, 185, 129, 0.05)',
      }
    },
  },
  plugins: [],
}
