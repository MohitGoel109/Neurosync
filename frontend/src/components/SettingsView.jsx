const THEMES = [
  { id: 'cognitive-radar', label: 'Cognitive Radar', desc: 'Naval sonar HUD — teal & amber' },
  { id: 'zen-circuit', label: 'Zen Circuit', desc: 'Calm minimal — sand & teal' },
  { id: 'neural-garden', label: 'Neural Garden', desc: 'Organic growth — warm greens' },
  { id: 'mission-control', label: 'Mission Control', desc: 'Amber cockpit telemetry' },
  { id: 'synthwave-grid', label: 'Synthwave Grid', desc: 'Neon outrun — most dramatic' },
]

export default function SettingsView({ theme, setTheme }) {
  return (
    <div className="p-6 flex flex-col gap-6 max-w-3xl">
      <div className="ns-panel p-5">
        <h3 className="font-mono text-xs uppercase tracking-widest mb-4" style={{ color: 'var(--text-dim)' }}>
          Theme
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className="text-left rounded p-3 border transition-all"
              style={{
                borderColor: theme === t.id ? 'var(--trace)' : 'var(--panel-border)',
                background: theme === t.id ? 'color-mix(in srgb, var(--trace) 10%, transparent)' : 'transparent',
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  data-theme={t.id}
                  style={{ background: 'var(--trace)' }}
                />
                <span className="font-mono text-sm" style={{ color: 'var(--text)' }}>{t.label}</span>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-dim)' }}>{t.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="ns-panel p-5">
        <h3 className="font-mono text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--text-dim)' }}>
          Focus score formula
        </h3>
        <p className="text-sm mb-3" style={{ color: 'var(--text-dim)' }}>
          A transparent weighted formula, not a black-box model — every score is explainable:
        </p>
        <ul className="font-mono text-xs flex flex-col gap-1.5" style={{ color: 'var(--text)' }}>
          <li>• Attention (looking at screen) — <span style={{ color: 'var(--trace)' }}>45%</span></li>
          <li>• Typing activity — <span style={{ color: 'var(--trace)' }}>20%</span></li>
          <li>• Not idle — <span style={{ color: 'var(--trace)' }}>20%</span></li>
          <li>• No distraction app open — <span style={{ color: 'var(--trace)' }}>15%</span></li>
        </ul>
      </div>

      <div className="ns-panel p-5">
        <h3 className="font-mono text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--text-dim)' }}>
          Distraction blocklist
        </h3>
        <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
          Editable at <code style={{ color: 'var(--text)' }}>agent/distraction_config.json</code>,
          created automatically the first time the agent runs. Add or remove any app/site keyword —
          matching is case-insensitive against the active window title.
        </p>
      </div>
    </div>
  )
}
