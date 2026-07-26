import { useEffect, useState } from 'react'
import { fetchBlocklist, saveBlocklist } from '../useLiveFocus'
import Skeleton from './Skeleton'

const THEMES = [
  { id: 'cognitive-radar', label: 'Cognitive Radar', desc: 'Naval sonar HUD — teal & amber' },
  { id: 'zen-circuit', label: 'Zen Circuit', desc: 'Calm minimal — sand & teal' },
  { id: 'neural-garden', label: 'Neural Garden', desc: 'Organic growth — warm greens' },
  { id: 'mission-control', label: 'Mission Control', desc: 'Amber cockpit telemetry' },
  { id: 'synthwave-grid', label: 'Synthwave Grid', desc: 'Neon outrun — most dramatic' },
]

export default function SettingsView({ theme, setTheme }) {
  const [blocklist, setBlocklistState] = useState([])
  const [loading, setLoading] = useState(true)
  const [newApp, setNewApp] = useState('')
  const [saveState, setSaveState] = useState('idle') // idle | saving | saved | error

  useEffect(() => {
    fetchBlocklist()
      .then((d) => setBlocklistState(d.blocklist))
      .catch(() => setBlocklistState([]))
      .finally(() => setLoading(false))
  }, [])

  function addApp() {
    const val = newApp.trim().toLowerCase()
    if (!val || blocklist.includes(val)) return
    setBlocklistState((prev) => [...prev, val])
    setNewApp('')
  }

  function removeApp(app) {
    setBlocklistState((prev) => prev.filter((a) => a !== app))
  }

  async function handleSave() {
    setSaveState('saving')
    try {
      await saveBlocklist(blocklist)
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 2000)
    } catch {
      setSaveState('error')
    }
  }

  return (
    <div className="p-6 flex flex-col gap-6 max-w-3xl">
      <div className="ns-panel p-5">
        <h3 className="font-mono text-xs uppercase tracking-widest mb-4" style={{ color: 'var(--text-dim)' }}>Theme</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {THEMES.map((t) => (
            <button
              key={t.id}
              data-ripple
              onClick={() => setTheme(t.id)}
              className="text-left rounded p-3 border relative transition-all"
              style={{
                borderColor: theme === t.id ? 'var(--trace)' : 'var(--panel-border)',
                background: theme === t.id ? 'color-mix(in srgb, var(--trace) 10%, transparent)' : 'transparent',
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="w-3 h-3 rounded-full flex-shrink-0" data-theme={t.id} style={{ background: 'var(--trace)' }} />
                <span className="font-mono text-sm" style={{ color: 'var(--text)' }}>{t.label}</span>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-dim)' }}>{t.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="ns-panel p-5">
        <h3 className="font-mono text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--text-dim)' }}>Focus score formula</h3>
        <p className="text-sm mb-3" style={{ color: 'var(--text-dim)' }}>
          A transparent weighted formula, not a black-box model:
        </p>
        <ul className="font-mono text-xs flex flex-col gap-1.5" style={{ color: 'var(--text)' }}>
          <li>• Attention (looking at screen) — <span style={{ color: 'var(--trace)' }}>45%</span></li>
          <li>• Typing activity — <span style={{ color: 'var(--trace)' }}>20%</span></li>
          <li>• Not idle — <span style={{ color: 'var(--trace)' }}>20%</span></li>
          <li>• No distraction app open — <span style={{ color: 'var(--trace)' }}>15%</span></li>
        </ul>
      </div>

      <div className="ns-panel p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>Distraction blocklist</h3>
          <button
            data-ripple
            onClick={handleSave}
            disabled={saveState === 'saving'}
            className="font-mono text-xs px-3 py-1.5 rounded border relative disabled:opacity-50"
            style={{
              borderColor: saveState === 'saved' ? 'var(--trace)' : 'var(--panel-border)',
              color: saveState === 'saved' ? 'var(--trace)' : 'var(--text)',
            }}
          >
            {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved ✓' : saveState === 'error' ? 'Failed — retry' : 'Save'}
          </button>
        </div>

        {loading ? (
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} width="90px" height="28px" className="rounded-full" />)}
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 mb-4">
              {blocklist.map((app) => (
                <span
                  key={app}
                  className="font-mono text-xs px-3 py-1.5 rounded-full border flex items-center gap-2"
                  style={{ borderColor: 'var(--panel-border)', color: 'var(--text)' }}
                >
                  {app}
                  <button onClick={() => removeApp(app)} style={{ color: 'var(--alert)' }} className="font-bold leading-none">×</button>
                </span>
              ))}
              {blocklist.length === 0 && (
                <span className="text-xs" style={{ color: 'var(--text-dim)' }}>No apps blocked — add one below.</span>
              )}
            </div>
            <div className="flex gap-2">
              <input
                value={newApp}
                onChange={(e) => setNewApp(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addApp()}
                placeholder="e.g. reddit"
                className="font-mono text-xs px-3 py-2 rounded border bg-transparent flex-1"
                style={{ borderColor: 'var(--panel-border)', color: 'var(--text)' }}
              />
              <button
                data-ripple
                onClick={addApp}
                className="font-mono text-xs px-4 py-2 rounded border relative"
                style={{ borderColor: 'var(--trace)', color: 'var(--trace)' }}
              >
                Add
              </button>
            </div>
            <p className="text-xs mt-3" style={{ color: 'var(--text-dim)' }}>
              Matches are case-insensitive against the active window title. The agent picks up
              changes on its next restart, or immediately if it re-fetches on each loop.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
