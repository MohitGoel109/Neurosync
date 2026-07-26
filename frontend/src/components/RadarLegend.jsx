export default function RadarLegend() {
  return (
    <div className="flex flex-col gap-1.5 font-mono text-[11px]" style={{ color: 'var(--text-dim)' }}>
      <div className="flex items-center gap-2">
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ background: 'var(--accent-amber)' }}
        />
        <span>
          <strong style={{ color: 'var(--text)' }}>Amber dot</strong> — your live focus level.
          Closer to center = higher focus score.
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ background: 'var(--alert)' }}
        />
        <span>
          <strong style={{ color: 'var(--text)' }}>Red dot</strong> — a distraction event.
          Click one to see which app and when.
        </span>
      </div>
    </div>
  )
}