export default function Skeleton({ className = '', height = '1rem', width = '100%' }) {
  return (
    <div
      className={`animate-pulse rounded ${className}`}
      style={{
        height,
        width,
        background:
          'linear-gradient(90deg, var(--panel-border) 25%, var(--trace-dim) 50%, var(--panel-border) 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-shimmer 1.6s ease-in-out infinite',
      }}
    >
      <style>{`
        @keyframes skeleton-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}
