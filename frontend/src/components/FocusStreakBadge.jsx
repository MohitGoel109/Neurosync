export default function FocusStreakBadge({ streak = 0, bestStreak = 0 }) {
  const mins = Math.floor(streak / 60)
  const secs = streak % 60
  const active = streak > 0

  return (
    <div className="ns-panel p-4 flex items-center gap-3">
      <span
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{
          background: active ? 'var(--accent-amber)' : 'var(--panel-border)',
          animation: active ? 'streak-pulse 1.4s ease-in-out infinite' : 'none',
        }}
      />
      <div>
        <span className="font-mono text-xs uppercase tracking-widest block" style={{ color: 'var(--text-dim)' }}>
          Focus streak
        </span>
        <span className="font-mono text-lg font-bold" style={{ color: active ? 'var(--accent-amber)' : 'var(--text)' }}>
          {mins}m {secs}s
        </span>
        <span className="text-xs ml-2" style={{ color: 'var(--text-dim)' }}>
          best: {Math.floor(bestStreak / 60)}m {bestStreak % 60}s
        </span>
      </div>
      <style>{`
        @keyframes streak-pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 color-mix(in srgb, var(--accent-amber) 50%, transparent); }
          50% { opacity: 0.7; box-shadow: 0 0 0 4px transparent; }
        }
      `}</style>
    </div>
  )
}
