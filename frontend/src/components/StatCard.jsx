export default function StatCard({ label, value, sublabel }) {
  return (
    <div className="ns-panel p-4 flex flex-col gap-1">
      <span className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>
        {label}
      </span>
      <span className="font-mono text-2xl font-bold" style={{ color: 'var(--text)' }}>
        {value}
      </span>
      {sublabel && (
        <span className="text-xs" style={{ color: 'var(--text-dim)' }}>{sublabel}</span>
      )}
    </div>
  )
}
