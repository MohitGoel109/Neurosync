import { useEffect, useState } from 'react'

export default function FocusRing({ score = 0, size = 140 }) {
  const [displayScore, setDisplayScore] = useState(0)
  const radius = size / 2 - 10
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - displayScore / 100)

  useEffect(() => {
    // Count up/down toward the new score instead of snapping instantly.
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
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--panel-border)"
          strokeWidth="8"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--accent-amber)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-3xl font-bold" style={{ color: 'var(--text)' }}>
          {displayScore}
        </span>
        <span className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>
          focus
        </span>
      </div>
    </div>
  )
}
