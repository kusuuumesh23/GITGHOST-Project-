/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        border: 'var(--color-border)',
        charcoal: 'var(--color-text)',
        muted: {
          DEFAULT: 'var(--color-muted)',
          foreground: 'var(--color-muted)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          hover: 'var(--color-accent-hover)',
          soft: 'var(--color-accent-soft)',
        },
        status: {
          draft: {
            text: 'var(--color-status-draft-text)',
            bg: 'var(--color-status-draft-bg)',
            border: 'var(--color-status-draft-border)',
          },
          ready: {
            text: 'var(--color-status-ready-text)',
            bg: 'var(--color-status-ready-bg)',
            border: 'var(--color-status-ready-border)',
          },
          published: {
            text: 'var(--color-status-published-text)',
            bg: 'var(--color-status-published-bg)',
            border: 'var(--color-status-published-border)',
          },
          failed: {
            text: 'var(--color-status-failed-text)',
            bg: 'var(--color-status-failed-bg)',
            border: 'var(--color-status-failed-border)',
          },
        },
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '8px',
        md: '8px',
        lg: '10px',
        xl: '12px',
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgba(31, 36, 33, 0.05)',
        card: '0 1px 3px 0 rgba(31, 36, 33, 0.06), 0 1px 2px -1px rgba(31, 36, 33, 0.04)',
        modal: '0 10px 25px -5px rgba(31, 36, 33, 0.1), 0 8px 10px -6px rgba(31, 36, 33, 0.05)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      transitionDuration: {
        DEFAULT: '150ms',
        fast: '150ms',
        normal: '200ms',
      },
    },
  },
  plugins: [],
};
