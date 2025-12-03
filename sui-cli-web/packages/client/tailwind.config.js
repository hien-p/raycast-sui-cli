/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Raycast-inspired dark theme
        background: {
          primary: '#1a1a1a',
          secondary: '#232323',
          tertiary: '#2a2a2a',
          hover: '#333333',
          active: '#3a3a3a',
        },
        text: {
          primary: '#ffffff',
          secondary: '#999999',
          tertiary: '#666666',
          accent: '#007aff',
        },
        border: {
          DEFAULT: '#333333',
          light: '#444444',
        },
        accent: {
          DEFAULT: '#007aff',
          hover: '#0066dd',
          muted: 'rgba(0, 122, 255, 0.1)',
        },
        success: '#34c759',
        warning: '#ff9f0a',
        error: '#ff453a',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Text',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: ['SF Mono', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        modal: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        dropdown: '0 10px 40px -10px rgba(0, 0, 0, 0.4)',
      },
      animation: {
        'fade-in': 'fadeIn 0.15s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
        'scale-in': 'scaleIn 0.15s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
