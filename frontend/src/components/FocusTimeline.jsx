import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function FocusTimeline({ data = [] }) {
  return (
    <div className="ns-panel p-4">
      <h3 className="font-mono text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--text-dim)' }}>
        Focus timeline
      </h3>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="focusFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--trace)" stopOpacity={0.4} />
              <stop offset="100%" stopColor="var(--trace)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--panel-border)" strokeDasharray="3 3" />
          <XAxis dataKey="hour" stroke="var(--text-dim)" fontSize={11} tickLine={false} />
          <YAxis domain={[0, 100]} stroke="var(--text-dim)" fontSize={11} tickLine={false} />
          <Tooltip
            contentStyle={{ background: 'var(--panel)', border: '1px solid var(--panel-border)', fontFamily: 'JetBrains Mono' }}
            labelStyle={{ color: 'var(--text)' }}
          />
          <Area type="monotone" dataKey="avg_score" stroke="var(--trace)" strokeWidth={2} fill="url(#focusFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
