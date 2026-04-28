/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-body)', 'sans-serif'],
        display: ['var(--font-display)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        brand: {
          50:  '#f0f9f4',
          100: '#dcf0e5',
          200: '#bbe1ce',
          300: '#8bcaae',
          400: '#57ac89',
          500: '#349068',  // primary green
          600: '#247352',
          700: '#1d5c42',
          800: '#194a36',
          900: '#163d2d',
          950: '#0b2219',
        },
        ink: {
          50:  '#f6f6f4',
          100: '#e8e8e3',
          200: '#d1d0c8',
          300: '#b3b1a5',
          400: '#918f80',
          500: '#767467',
          600: '#5e5c50',
          700: '#4c4b40',
          800: '#3f3e35',
          900: '#38372f',
          950: '#1e1e18',
        }
      },
      animation: {
        'fade-up': 'fadeUp 0.4s ease both',
        'fade-in': 'fadeIn 0.3s ease both',
        'slide-in': 'slideIn 0.3s ease both',
      },
      keyframes: {
        fadeUp:   { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        fadeIn:   { from: { opacity: '0' }, to: { opacity: '1' } },
        slideIn:  { from: { opacity: '0', transform: 'translateX(-8px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
      }
    },
  },
  plugins: [],
}
