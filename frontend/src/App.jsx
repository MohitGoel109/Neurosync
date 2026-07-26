import { useEffect, useState } from 'react'
import RadarSweep from './components/RadarSweep'
import FocusRing from './components/FocusRing'
import FocusTimeline from './components/FocusTimeline'
import AlertToast from './components/AlertToast'
import StatCard from './components/StatCard'
import HistoryView from './components/HistoryView'
import SettingsView from './components/SettingsView'
import { useLiveFocus, seedSimulatedData } from './useLiveFocus'

const THEMES = [
  { id: 'cognitive-radar', label: 'Cognitive Radar' },
  { id: 'zen-circuit', label: 'Zen Circuit' },
  { id: 'neural-garden', label: 'Neural Garden' },
  { id: 'mission-control', label: 'Mission Control' },
  { id: 'synthwave-grid', label: 'Synthwave Grid' },
]

const NAV = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'history', label: 'History' },
  { id: 'settings', label: 'Settings' },
]

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('ns-theme') || 'cognitive-radar')
  const [view, setView] = useState('dashboard')
  const [booted, setBooted] = useState(false)
  const [seedState, setSeedState] = useState('idle') // idle | loading | done
  const { focusScore, alerts, pings, timeline, connected, refetchTimeline } = useLiveFocus()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('ns-theme', theme)
  }, [theme])

  useEffect(() => {
    const t = setTimeout(() => setBooted(true), 900)
    return () => clearTimeout(t)
  }, [])

  async function handleLoadDemoData() {
    if (seedState === 'loading') return
    setSeedState('loading')
    await seedSimulatedData(3)
    await refetchTimeline()
    setSeedState('done')
    setTimeout(() => setSeedState('idle'), 2000)
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <AlertToast alerts={alerts} />

      <header
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b"
        style={{ borderColor: 'var(--panel-border)' }}
      >
        <div className="flex items-center gap-3 flex-wrap">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: connected ? 'var(--trace)' : 'var(--alert)' }}
          />
          <h1 className="font-mono text-lg tracking-widest uppercase ns-glow-text" style={{ color: 'var(--text)' }}>
            NeuroSync
          </h1>
          <span className="font-mono text-xs hidden sm:inline" style={{ color: 'var(--text-dim)' }}>
            {connected ? 'live feed connected' : 'no agent — showing simulated fallback'}
          </span>

          <nav className="flex items-center gap-1 ml-2">
            {NAV.map((n) => (
              <button
                key={n.id}
                onClick={() => setView(n.id)}
                className={`ns-nav-link ${view === n.id ? 'active' : ''}`}
              >
                {n.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleLoadDemoData}
            disabled={seedState === 'loading'}
            className="font-mono text-xs px-3 py-1.5 rounded border disabled:opacity-50"
            style={{ borderColor: 'var(--panel-border)', color: seedState === 'done' ? 'var(--trace)' : 'var(--text-dim)' }}
          >
            {seedState === 'loading' ? 'Loading…' : seedState === 'done' ? 'Loaded ✓' : 'Load demo data'}
          </button>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="font-mono text-xs px-3 py-1.5 rounded border bg-transparent"
            style={{ borderColor: 'var(--panel-border)', color: 'var(--text)' }}
          >
            {THEMES.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>
      </header>

      <main className={`transition-opacity duration-700 ${booted ? 'opacity-100' : 'opacity-0'}`}>
        {view === 'dashboard' && (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <section className="lg:col-span-1 ns-panel p-6 flex flex-col items-center gap-6">
              <RadarSweep focusScore={focusScore} distractionPings={pings} />
              <FocusRing score={focusScore} />
            </section>

            <section className="lg:col-span-2 flex flex-col gap-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard label="Focus score" value={focusScore} sublabel="live" />
                <StatCard label="Distraction pings" value={pings.length} sublabel="last few minutes" />
                <StatCard label="Status" value={connected ? 'Tracking' : 'Idle'} />
              </div>
              <FocusTimeline data={timeline} />
            </section>
          </div>
        )}

        {view === 'history' && <HistoryView />}
        {view === 'settings' && <SettingsView theme={theme} setTheme={setTheme} />}
      </main>
    </div>
  )
}
