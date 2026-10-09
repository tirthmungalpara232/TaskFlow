/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // "Current" — electric iris, the app's primary accent. Named for
        // the idea of work flowing through the board, To Do -> Done.
        brand: {
          50: '#F4F1FF',
          100: '#E7E0FF',
          200: '#CFC2FF',
          300: '#B29DFF',
          400: '#9575FF',
          500: '#7C5CFC',
          600: '#6438E8',
          700: '#4F28C4',
          800: '#3D1E99',
          900: '#2C1670',
        },
        // "Tide" — teal-cyan, the secondary flow color (in-progress / links).
        tide: {
          50: '#E6FFFB',
          100: '#C3FBF3',
          200: '#8FF3E6',
          300: '#52E6D3',
          400: '#22D3C7',
          500: '#14B8AE',
          600: '#0E948C',
          700: '#0B756F',
          800: '#0A5C57',
          900: '#073F3C',
        },
        // "Ember" — warm coral, reserved for high-priority / attention.
        ember: {
          50: '#FFF1EE',
          100: '#FFE1DB',
          300: '#FFAA9B',
          400: '#FF8A75',
          500: '#FF6B5E',
          600: '#E8483A',
          700: '#C22F23',
        },
        // Deep aubergine-black and pale violet-white — the app's two
        // "base" surfaces, instead of generic slate.
        midnight: '#0F0B1E',
        paper: '#FAF8FF',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        sans: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        auroraDrift: {
          '0%, 100%': { transform: 'translate(0%, 0%) scale(1)' },
          '33%': { transform: 'translate(4%, 6%) scale(1.08)' },
          '66%': { transform: 'translate(-3%, -4%) scale(0.96)' },
        },
        auroraDriftSlow: {
          '0%, 100%': { transform: 'translate(0%, 0%) scale(1)' },
          '50%': { transform: 'translate(-6%, 4%) scale(1.1)' },
        },
        sheen: {
          '0%': { transform: 'translateX(-150%) skewX(-15deg)' },
          '100%': { transform: 'translateX(250%) skewX(-15deg)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        popIn: {
          '0%': { transform: 'scale(0.85)', opacity: '0' },
          '60%': { transform: 'scale(1.04)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'aurora-1': 'auroraDrift 22s ease-in-out infinite',
        'aurora-2': 'auroraDriftSlow 28s ease-in-out infinite',
        'aurora-3': 'auroraDrift 34s ease-in-out infinite reverse',
        sheen: 'sheen 2.6s ease-in-out infinite',
        shimmer: 'shimmer 1.6s linear infinite',
        'pop-in': 'popIn 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'float-slow': 'floatSlow 5s ease-in-out infinite',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
