import { useMemo, useState } from 'react'

/**
 * The flagship visual: a rotating sonar sweep. The current focus score
 * sets the sweep's "contact" distance from center (higher focus = closer
 * to center). Distraction events are fading red pings around the ring —
 * click one to see which app and when.
 */
export default function RadarSweep({ focusScore = 0, distractionPings = [] }) {
  const size = 320
  const center = size / 2
  const maxRadius = center - 20
  const [selected, setSelected] = useState(null)

  const blipRadius = useMemo(
    () => maxRadius * (1 - focusScore / 100),
    [focusScore, maxRadius]
  )

  const rings = [0.25, 0.5, 0.75, 1].map((f) => maxRadius * f)

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {rings.map((r) => (
          <circle key={r} cx={center} cy={center} r={r} fill="none" stroke="var(--trace-dim)" strokeWidth="1" opacity="0.6" />
        ))}
        <line x1={center} y1={20} x2={center} y2={size - 20} stroke="var(--trace-dim)" strokeWidth="1" opacity="0.4" />
        <line x1={20} y1={center} x2={size - 20} y2={center} stroke="var(--trace-dim)" strokeWidth="1" opacity="0.4" />

        <g style={{ transformOrigin: `${center}px ${center}px` }} className="radar-sweep-rotate">
          <path
            d={`M ${center} ${center} L ${center} 20 A ${center - 20} ${center - 20} 0 0 1 ${
              center + (center - 20) * Math.sin(Math.PI / 6)
            } ${center - (center - 20) * Math.cos(Math.PI / 6)} Z`}
            fill="var(--trace)"
            opacity="0.15"
          />
        </g>

        {distractionPings.map((ping, i) => {
          const angle = (ping.angle ?? i * 47) * (Math.PI / 180)
          const r = maxRadius * 0.7
          const x = center + r * Math.cos(angle)
          const y = center + r * Math.sin(angle)
          return (
            <circle
              key={ping.id ?? i}
              cx={x} cy={y} r="6"
              fill="var(--alert)"
              opacity={ping.opacity ?? 0.8}
              style={{ cursor: 'pointer' }}
              onClick={() => setSelected(selected?.id === ping.id ? null : ping)}
            />
          )
        })}

        <circle cx={center} cy={center - blipRadius} r="7" fill="var(--accent-amber)" className="radar-blip-pulse" />
      </svg>

      {selected && (
        <div
          className="absolute px-3 py-2 rounded text-xs font-mono ns-panel"
          style={{
            top: 8, right: 8, color: 'var(--text)',
            background: 'var(--panel)', border: '1px solid var(--panel-border)',
            maxWidth: 180,
          }}
        >
          <div style={{ color: 'var(--alert)' }} className="mb-0.5">Distraction ping</div>
          <div className="truncate">{selected.app || 'unknown app'}</div>
          <div style={{ color: 'var(--text-dim)' }}>{selected.timestamp?.slice(11, 19) || ''}</div>
        </div>
      )}

      <style>{`
        .radar-sweep-rotate { animation: radar-spin 4s linear infinite; }
        @keyframes radar-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .radar-blip-pulse { animation: blip-pulse 1.8s ease-in-out infinite; }
        @keyframes blip-pulse { 0%, 100% { r: 7; opacity: 1; } 50% { r: 10; opacity: 0.6; } }
      `}</style>
    </div>
  )
}
