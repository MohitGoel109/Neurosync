/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        panel: 'var(--panel)',
        border: 'var(--panel-border)',
        trace: 'var(--trace)',
        'trace-dim': 'var(--trace-dim)',
        alert: 'var(--alert)',
        amber: 'var(--accent-amber)',
        ink: 'var(--text)',
        'ink-dim': 'var(--text-dim)',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [],
}
