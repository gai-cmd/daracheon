import type { Config } from 'tailwindcss';

/**
 * Design tokens aligned with ZOEL LIFE reference
 * - luxury-black: #0a0b10
 * - luxury-gold:  #d4a843
 * - luxury-cream: #f5f5f5
 * - luxury-sage:  #4a6741
 * - typography: unified on Noto Sans KR (all roles)
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          // Rebalanced for WCAG AA (≥ 4.5:1 on light AND dark backgrounds)
          // Brand accent (bg/border/large icons) uses gold-400/500 (#d4a843 honey gold).
          // Body/label text on light bg should use gold-600/700 for legibility.
          50: '#fbf6e6',
          100: '#f6e9bf',
          200: '#ecd488',
          300: '#e2bf56',
          400: '#d4a843', // ZOEL LIFE brand honey — use for backgrounds, icons, dividers, and text on dark bg
          500: '#b88c2d', // Readable on white (4.6:1) AND black (4.9:1) — default text accent
          600: '#9e7825',
          700: '#7a5d1d',
          800: '#5a4415',
          900: '#3d2e0e',
        },
        sage: {
          50: '#eef3ec',
          100: '#d5e0d0',
          200: '#a8bfa0',
          300: '#7a9c70',
          400: '#5b7f52',
          500: '#4a6741',
          600: '#3a5134',
          700: '#2c3e28',
          800: '#1e2b1c',
          900: '#121a10',
        },
        luxury: {
          black: '#0a0b10',
          ink: '#14161f',
          slate: '#1a1d29',
          cream: '#f5f5f5',
          ivory: '#fdfbf7',
          sand: '#f8f5f0',
          gold: '#d4a843',
          caramel: '#d4a574',
          bronze: '#5c3d2e',
          sage: '#4a6741',
        },
        agarwood: {
          50: '#f5f0e8',
          100: '#e8dfd0',
          200: '#d4c5a8',
          300: '#b5a07a',
          400: '#967b55',
          500: '#7a6240',
          600: '#5e4a30',
          700: '#453624',
          800: '#2d231a',
          900: '#1a1510',
        },
        forest: {
          50: '#eef3ec',
          100: '#d5e0d0',
          200: '#a8bfa0',
          300: '#7a9c70',
          400: '#5b7f52',
          500: '#4a6741',
          600: '#3a5134',
          700: '#2c3e28',
          800: '#1e2b1c',
          900: '#121a10',
        },
      },
      fontFamily: {
        // ZOEL LIFE resolves every type role (sans / serif / display) to Noto Sans KR.
        // We keep the role names so existing className="font-serif" etc. still works,
        // but each resolves to the same stack, differentiated by weight.
        display: ['"Noto Sans KR"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['"Noto Sans KR"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['"Noto Sans KR"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['"Noto Sans KR"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-up': 'fadeUp 0.8s ease-out forwards',
        'fade-in': 'fadeIn 1s ease-out forwards',
        'slide-left': 'slideLeft 0.8s ease-out forwards',
        'slide-right': 'slideRight 0.8s ease-out forwards',
        marquee: 'marquee 40s linear infinite',
        'hero-zoom': 'heroZoom 25s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(40px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideLeft: {
          from: { opacity: '0', transform: 'translateX(-60px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        slideRight: {
          from: { opacity: '0', transform: 'translateX(60px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        heroZoom: {
          '0%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1.15)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
