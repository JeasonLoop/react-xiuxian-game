/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Noto Serif SC"', 'serif'],
      },
      colors: {
        ink: {
          900: '#0f0f12',
          800: '#1a1b1e',
          700: '#27282d',
        },
        paper: {
          100: '#f5f5f0',
          200: '#e6e6dc',
          800: '#2d2d2a',
          900: '#1c1c1a',
        },
        mystic: {
          gold: '#cba135',
          jade: '#5c946e',
          blood: '#8a2c2c',
        },
      },
      animation: {
        shake: 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
        'float-up': 'floatUp 1s ease-out forwards',
        slash: 'slash 0.3s ease-out forwards',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
      },
      keyframes: {
        shake: {
          '10%, 90%': { transform: 'translate3d(-1px, 0, 0)' },
          '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
          '30%, 50%, 70%': { transform: 'translate3d(-4px, 0, 0)' },
          '40%, 60%': { transform: 'translate3d(4px, 0, 0)' },
        },
        floatUp: {
          '0%': {
            opacity: '1',
            transform: 'translate(-50%, -50%) scale(0.5)',
          },
          '20%': {
            opacity: '1',
            transform: 'translate(-50%, -150%) scale(1.2)',
          },
          '100%': {
            opacity: '0',
            transform: 'translate(-50%, -300%) scale(1)',
          },
        },
        slash: {
          '0%': {
            opacity: '0',
            transform: 'translate(-50%, -50%) rotate(45deg) scaleX(0)',
          },
          '50%': {
            opacity: '1',
            transform: 'translate(-50%, -50%) rotate(45deg) scaleX(1)',
          },
          '100%': {
            opacity: '0',
            transform: 'translate(-50%, -50%) rotate(45deg) scaleX(1.2)',
          },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glowPulse: {
          '0%, 100%': {
            opacity: '1',
            filter: 'drop-shadow(0 0 30px rgba(203, 161, 53, 0.5))',
          },
          '50%': {
            opacity: '0.9',
            filter: 'drop-shadow(0 0 50px rgba(203, 161, 53, 0.8))',
          },
        },
      },
    },
  },
  plugins: [],
};
