import { useEffect, useRef, useState } from 'react'

function formatDuration(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':')
}

export default function SessionTimer() {
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running])

  return (
    <div className="ns-panel p-4 flex items-center justify-between gap-4">
      <div>
        <span className="font-mono text-xs uppercase tracking-widest block mb-1" style={{ color: 'var(--text-dim)' }}>
          Session timer
        </span>
        <span className="font-mono text-2xl font-bold tabular-nums" style={{ color: 'var(--text)' }}>
          {formatDuration(seconds)}
        </span>
      </div>
      <div className="flex gap-2">
        <button
          data-ripple
          onClick={() => setRunning((r) => !r)}
          className="font-mono text-xs px-3 py-2 rounded border relative"
          style={{
            borderColor: running ? 'var(--alert)' : 'var(--trace)',
            color: running ? 'var(--alert)' : 'var(--trace)',
          }}
        >
          {running ? 'Pause' : seconds === 0 ? 'Start' : 'Resume'}
        </button>
        <button
          data-ripple
          onClick={() => { setRunning(false); setSeconds(0) }}
          className="font-mono text-xs px-3 py-2 rounded border relative"
          style={{ borderColor: 'var(--panel-border)', color: 'var(--text-dim)' }}
        >
          Reset
        </button>
      </div>
    </div>
  )
}
