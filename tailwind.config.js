module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Logos Engine Dark Palette ──────────────────────────
        base:     '#04070f',   // deep void
        surface:  '#080e1c',   // canvas
        card:     '#0c1526',   // node cards
        card2:    '#101c30',   // card hover / elevated
        border:   '#162038',   // subtle structural borders
        border2:  '#1e3052',   // active borders
        ink:      '#e2e8f8',   // primary text
        ink2:     '#8ea5c8',   // secondary text
        ink3:     '#4a6080',   // muted / placeholder

        // ── Node Brand Colors ──────────────────────────────────
        cortex:   '#3b82f6',   // blue     — Nervous/Skeletal
        looper:   '#10b981',   // emerald  — Cardiovascular
        muse:     '#8b5cf6',   // violet   — Endocrine
        sentinel: '#f59e0b',   // amber    — Immune
        synth:    '#06b6d4',   // cyan     — Respiratory
        critic:   '#ef4444',   // red      — Adversarial

        // ── Status ─────────────────────────────────────────────
        'status-ok':   '#10b981',
        'status-warn': '#f59e0b',
        'status-error':'#ef4444',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'glow-cortex':   '0 0 16px rgba(59, 130, 246, 0.45)',
        'glow-looper':   '0 0 16px rgba(16, 185, 129, 0.45)',
        'glow-muse':     '0 0 16px rgba(139, 92, 246, 0.45)',
        'glow-sentinel': '0 0 16px rgba(245, 158, 11, 0.45)',
        'glow-synth':    '0 0 16px rgba(6, 182, 212, 0.45)',
        'glow-sm':       '0 0 8px rgba(59, 130, 246, 0.3)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flow':       'flow 2s linear infinite',
      },
      backgroundImage: {
        'dot-grid': 'radial-gradient(circle, #1a2744 1px, transparent 1px)',
      },
      backgroundSize: {
        'dot-24': '24px 24px',
      },
    },
  },
  plugins: [],
};
