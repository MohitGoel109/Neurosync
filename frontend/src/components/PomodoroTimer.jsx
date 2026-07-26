import { useEffect, useRef, useState } from 'react'

const POMODORO_SECONDS = 25 * 60

export default function PomodoroTimer() {
  const [remaining, setRemaining] = useState(POMODORO_SECONDS)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (running && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining((r) => {
          if (r <= 1) {
            setRunning(false)
            return 0
          }
          return r - 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running, remaining])

  const progress = 1 - remaining / POMODORO_SECONDS
  const size = 72
  const radius = size / 2 - 6
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - progress)
  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60

  return (
    <div className="ns-panel p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--panel-border)" strokeWidth="5" />
            <circle
              cx={size / 2} cy={size / 2} r={radius} fill="none"
              stroke={remaining === 0 ? 'var(--alert)' : 'var(--trace)'}
              strokeWidth="5" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center font-mono text-xs font-bold" style={{ color: 'var(--text)' }}>
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </div>
        </div>
        <div>
          <span className="font-mono text-xs uppercase tracking-widest block" style={{ color: 'var(--text-dim)' }}>
            Pomodoro
          </span>
          <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
            {remaining === 0 ? 'Complete — take a break' : running ? 'In progress' : 'Ready'}
          </span>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          data-ripple
          onClick={() => setRunning((r) => !r)}
          disabled={remaining === 0}
          className="font-mono text-xs px-3 py-2 rounded border relative disabled:opacity-40"
          style={{ borderColor: 'var(--trace)', color: 'var(--trace)' }}
        >
          {running ? 'Pause' : 'Start'}
        </button>
        <button
          data-ripple
          onClick={() => { setRunning(false); setRemaining(POMODORO_SECONDS) }}
          className="font-mono text-xs px-3 py-2 rounded border relative"
          style={{ borderColor: 'var(--panel-border)', color: 'var(--text-dim)' }}
        >
          Reset
        </button>
      </div>
    </div>
  )
}
