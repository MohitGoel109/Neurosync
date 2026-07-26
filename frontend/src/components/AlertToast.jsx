export default function AlertToast({ alerts = [] }) {
  if (alerts.length === 0) return null

  return (
    <div className="fixed top-6 right-6 flex flex-col gap-2 z-50">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className="alert-slide-in font-mono text-sm px-4 py-3 rounded border flex items-center gap-3"
          style={{
            background: 'var(--panel)',
            borderColor: 'var(--alert)',
            color: 'var(--text)',
            minWidth: 280,
          }}
        >
          <span
            className="inline-block w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: 'var(--alert)' }}
          />
          <span>{alert.message}</span>
        </div>
      ))}
      <style>{`
        .alert-slide-in {
          animation: slide-in 0.35s ease-out;
        }
        @keyframes slide-in {
          from { transform: translateX(40px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
