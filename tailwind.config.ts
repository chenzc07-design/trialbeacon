import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0b1220',
          900: '#0f1b2d',
          800: '#152438',
          700: '#1d2f47',
        },
        navy: {
          50: '#f2f6fb',
          100: '#e3ebf5',
          200: '#c6d7ea',
          300: '#9bb8d8',
          400: '#6892c1',
          500: '#4372a8',
          600: '#325a8c',
          700: '#294a72',
          800: '#243e5f',
          900: '#1e3350',
          950: '#0f1c30',
        },
        slateish: {
          50: '#f7f9fb',
          100: '#eef2f6',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
        },
        region: {
          us: '#2563a8',
          eu: '#3f6f5e',
          cn: '#8a5a2b',
        },
      },
      fontFamily: {
        sans: [
          'var(--font-sans)',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        card: '14px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 28, 48, 0.04), 0 1px 3px rgba(15, 28, 48, 0.06)',
        'card-hover':
          '0 4px 12px rgba(15, 28, 48, 0.07), 0 2px 4px rgba(15, 28, 48, 0.05)',
        subtle: '0 1px 0 rgba(15, 28, 48, 0.05)',
      },
      maxWidth: {
        content: '1140px',
        prose: '68ch',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-500px 0' },
          '100%': { backgroundPosition: '500px 0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.24s ease-out both',
        shimmer: 'shimmer 1.4s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
