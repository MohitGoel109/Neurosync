import { useBrowserTracking } from '../useBrowserTracking'

const STATUS_LABEL = {
  idle: 'Not tracking',
  requesting: 'Requesting camera access…',
  calibrating: 'Calibrating — look at your screen normally…',
  active: 'Tracking (this browser tab only)',
  denied: 'Camera permission denied',
  error: 'Something went wrong',
}

export default function BrowserTrackerPanel() {
  const { status, error, start, stop } = useBrowserTracking()
  const isActive = status === 'active' || status === 'calibrating' || status === 'requesting'

  return (
    <div className="ns-panel p-4 flex items-center justify-between gap-4 flex-wrap">
      <div>
        <span className="font-mono text-xs uppercase tracking-widest block mb-1" style={{ color: 'var(--text-dim)' }}>
          Browser tracking (no install)
        </span>
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: status === 'active' ? 'var(--trace)' : status === 'denied' || status === 'error' ? 'var(--alert)' : 'var(--panel-border)' }}
          />
          <span className="text-sm" style={{ color: 'var(--text)' }}>{STATUS_LABEL[status]}</span>
        </div>
        {status === 'idle' && (
          <p className="text-xs mt-1 max-w-md" style={{ color: 'var(--text-dim)' }}>
            Runs entirely in your browser using your webcam — nothing is installed and no video ever
            leaves your device. Distraction detection is limited to "did you leave this tab," since a
            webpage can't see other apps.
          </p>
        )}
        {status === 'denied' && (
          <p className="text-xs mt-1" style={{ color: 'var(--alert)' }}>
            Camera access was denied. Check your browser's site permissions and try again.
          </p>
        )}
        {status === 'error' && (
          <p className="text-xs mt-1" style={{ color: 'var(--alert)' }}>{error}</p>
        )}
      </div>
      <button
        data-ripple
        onClick={isActive ? stop : start}
        className="font-mono text-xs px-4 py-2 rounded border relative flex-shrink-0"
        style={{
          borderColor: isActive ? 'var(--alert)' : 'var(--trace)',
          color: isActive ? 'var(--alert)' : 'var(--trace)',
        }}
      >
        {isActive ? 'Stop tracking' : 'Enable webcam tracking'}
      </button>
    </div>
  )
}