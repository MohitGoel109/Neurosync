import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import Skeleton from './Skeleton'

import { API_BASE } from '../config'

export default function HistoryView() {
  const [daily, setDaily] = useState([])
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/api/stats/daily?days=7`).then((r) => r.json()),
      fetch(`${API_BASE}/api/readings/table?limit=30`).then((r) => r.json()),
    ])
      .then(([d, t]) => {
        setDaily(d)
        setRows(t)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="ns-panel p-4">
        <h3 className="font-mono text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--text-dim)' }}>
          Distraction % — last 7 days
        </h3>
        {loading ? (
          <div className="h-[200px] flex items-end gap-3 px-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} width="100%" height={`${40 + (i % 4) * 30}px`} />
            ))}
          </div>
        ) : daily.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center font-mono text-xs" style={{ color: 'var(--text-dim)' }}>
            No data yet — load demo data or run a session first.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={daily}>
              <CartesianGrid stroke="var(--panel-border)" strokeDasharray="3 3" />
              <XAxis dataKey="day" stroke="var(--text-dim)" fontSize={11} tickLine={false} />
              <YAxis stroke="var(--text-dim)" fontSize={11} tickLine={false} unit="%" />
              <Tooltip
                contentStyle={{ background: 'var(--panel)', border: '1px solid var(--panel-border)', fontFamily: 'JetBrains Mono' }}
              />
              <Bar dataKey="distraction_pct" fill="var(--alert)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="ns-panel p-4">
        <h3 className="font-mono text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--text-dim)' }}>
          Recent readings
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full font-mono text-xs" style={{ color: 'var(--text)' }}>
            <thead>
              <tr style={{ color: 'var(--text-dim)' }} className="text-left border-b" >
                <th className="py-2 pr-4" style={{ borderColor: 'var(--panel-border)' }}>Time</th>
                <th className="py-2 pr-4">App</th>
                <th className="py-2 pr-4">Attention</th>
                <th className="py-2 pr-4">Distraction</th>
                <th className="py-2 pr-4">Score</th>
              </tr>
            </thead>
            <tbody>
              {loading && Array.from({ length: 5 }).map((_, i) => (
                <tr key={`sk-${i}`} className="border-b" style={{ borderColor: 'var(--panel-border)' }}>
                  <td className="py-2 pr-4" colSpan={5}><Skeleton height="14px" /></td>
                </tr>
              ))}
              {!loading && rows.map((r) => (
                <tr key={r.id} className="border-b" style={{ borderColor: 'var(--panel-border)' }}>
                  <td className="py-2 pr-4">{r.timestamp?.slice(11, 19)}</td>
                  <td className="py-2 pr-4 truncate max-w-[200px]">{r.active_app}</td>
                  <td className="py-2 pr-4">{r.attention ? 'yes' : 'no'}</td>
                  <td className="py-2 pr-4" style={{ color: r.is_distraction ? 'var(--alert)' : 'inherit' }}>
                    {r.is_distraction ? 'yes' : 'no'}
                  </td>
                  <td className="py-2 pr-4">{r.focus_score}</td>
                </tr>
              ))}
              {rows.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="py-6 text-center" style={{ color: 'var(--text-dim)' }}>
                    No readings yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
