/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './lib/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['var(--font-cormorant)', 'Georgia', 'serif'],
        sans: ['var(--font-outfit)', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        'lj-bg': 'var(--lj-bg)',
        'lj-surface': 'var(--lj-surface)',
        'lj-text': 'var(--lj-text)',
        'lj-muted': 'var(--lj-muted)',
        'lj-border': 'var(--lj-border)',
        'lj-accent': 'var(--lj-accent)',
      },
      animation: {
        ljFade: 'ljFade 350ms ease',
      },
    },
  },
  plugins: [],
};
