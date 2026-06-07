import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0f1715',
        panel: '#16211e',
        panel2: '#1c2a26',
        line: '#26352f',
        accent: '#5fd6a6',
        accent2: '#7fb8ff',
        warn: '#f0a35e',
        danger: '#ef6f6f',
        muted: '#8aa19a',
        text: '#e7f0ec',
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'Georgia', 'serif'],
        body: ['var(--font-spline)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        panel: '0 1px 0 rgba(255,255,255,0.03) inset, 0 8px 24px rgba(0,0,0,0.25)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
};

export default config;
