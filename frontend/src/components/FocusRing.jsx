import { useEffect, useState } from 'react'

const LABELS = {
  attention: 'Attention',
  typing: 'Typing',
  idle: 'Not idle',
  distraction: 'No distraction',
}

export default function FocusRing({ score = 0, breakdown = null, size = 140 }) {
  const [displayScore, setDisplayScore] = useState(0)
  const [hovered, setHovered] = useState(false)
  const radius = size / 2 - 10
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - displayScore / 100)

  useEffect(() => {
    const start = displayScore
    const diff = score - start
    const durationMs = 600
    const startTime = performance.now()
    let frame
    const step = (now) => {
      const t = Math.min(1, (now - startTime) / durationMs)
      setDisplayScore(Math.round(start + diff * t))
      if (t < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score])

  return (
    <div
      className="relative"
      style={{ width: size, height: size }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--panel-border)" strokeWidth="8" />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="var(--accent-amber)" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-3xl font-bold" style={{ color: 'var(--text)' }}>{displayScore}</span>
        <span className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>focus</span>
      </div>

      {hovered && breakdown && (
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded p-3 z-10"
          style={{
            top: size + 8, width: 180,
            background: 'var(--panel)', border: '1px solid var(--panel-border)',
            boxShadow: '0 8px 24px -8px rgba(0,0,0,0.6)',
          }}
        >
          <div className="font-mono text-[10px] uppercase tracking-widest mb-2" style={{ color: 'var(--text-dim)' }}>
            Score breakdown
          </div>
          {Object.entries(LABELS).map(([key, label]) => {
            const val = breakdown[key] ?? 0
            const max = key === 'attention' ? 45 : key === 'typing' || key === 'idle' ? 20 : 15
            return (
              <div key={key} className="mb-1.5">
                <div className="flex justify-between font-mono text-[10px] mb-0.5" style={{ color: 'var(--text)' }}>
                  <span>{label}</span><span>{val}</span>
                </div>
                <div className="h-1 rounded" style={{ background: 'var(--panel-border)' }}>
                  <div
                    className="h-1 rounded"
                    style={{ width: `${(val / max) * 100}%`, background: 'var(--trace)', transition: 'width 0.4s ease' }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
