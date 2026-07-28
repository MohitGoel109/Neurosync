import { useEffect, useRef, useState } from 'react'
import { API_BASE, WS_BASE } from './config'
const STREAK_THRESHOLD = 70
const ACTIVITY_TIMEOUT_MS = 10000 // no reading in 10s = considered idle, not actively tracking

export function useLiveFocus() {
  const [focusScore, setFocusScore] = useState(0)
  const [breakdown, setBreakdown] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [pings, setPings] = useState([])
  const [timeline, setTimeline] = useState([])
  const [timelineLoading, setTimelineLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const [activityStatus, setActivityStatus] = useState('no-agent')
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const distractionStreak = useRef(0)
  const streakSeconds = useRef(0)
  const lastReadingAt = useRef(null)

  async function refetchTimeline() {
    try {
      setTimelineLoading(true)
      const r = await fetch(`${API_BASE}/api/stats/hourly`)
      setTimeline(await r.json())
    } catch {
      // backend not reachable yet — leave existing timeline as-is
    } finally {
      setTimelineLoading(false)
    }
  }

  useEffect(() => {
    refetchTimeline()
  }, [])

  useEffect(() => {
    let ws
    let retryTimer

    function connect() {
      ws = new WebSocket(`${WS_BASE}/ws/live`)
      ws.onopen = () => setConnected(true)
      ws.onclose = () => {
        setConnected(false)
        setActivityStatus('no-agent')
        retryTimer = setTimeout(connect, 2000)
      }
      ws.onmessage = (event) => {
        const reading = JSON.parse(event.data)
        lastReadingAt.current = Date.now()
        setActivityStatus('active')
        setFocusScore(reading.focus_score)
        if (reading.score_components) setBreakdown(reading.score_components)

        if (reading.focus_score >= STREAK_THRESHOLD) {
          streakSeconds.current += 2
          setStreak(streakSeconds.current)
          setBestStreak((b) => Math.max(b, streakSeconds.current))
        } else {
          streakSeconds.current = 0
          setStreak(0)
        }

        if (reading.is_distraction) {
          distractionStreak.current += 1
          setPings((prev) => [
            {
              id: Date.now(),
              angle: Math.random() * 360,
              opacity: 0.9,
              app: reading.active_app,
              timestamp: reading.timestamp || new Date().toISOString(),
            },
            ...prev.slice(0, 7),
          ])
          if (distractionStreak.current === 3) {
            pushAlert(`Distracted on ${reading.active_app} — consider switching back.`)
          }
        } else {
          distractionStreak.current = 0
        }
      }
    }

    function pushAlert(message) {
      const id = Date.now()
      setAlerts((prev) => [...prev, { id, message }])
      setTimeout(() => {
        setAlerts((prev) => prev.filter((a) => a.id !== id))
      }, 5000)
    }

    connect()

    const activityCheckInterval = setInterval(() => {
      if (!lastReadingAt.current) return
      const sinceLastReading = Date.now() - lastReadingAt.current
      setActivityStatus((prev) => {
        if (prev === 'no-agent') return prev
        return sinceLastReading > ACTIVITY_TIMEOUT_MS ? 'idle' : 'active'
      })
    }, 2000)

    return () => {
      ws?.close()
      clearTimeout(retryTimer)
      clearInterval(activityCheckInterval)
    }
  }, [])

  return {
    focusScore,
    breakdown,
    alerts,
    pings,
    timeline,
    timelineLoading,
    connected,
    activityStatus,
    streak,
    bestStreak,
    refetchTimeline,
  }
}

export async function seedSimulatedData(hours = 3) {
  await fetch(`${API_BASE}/api/simulate/seed?hours=${hours}`, { method: 'POST' })
}

export async function fetchBlocklist() {
  const r = await fetch(`${API_BASE}/api/blocklist`)
  if (!r.ok) throw new Error('failed to load blocklist')
  return r.json()
}

export async function saveBlocklist(list) {
  const r = await fetch(`${API_BASE}/api/blocklist`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ blocklist: list }),
  })
  if (!r.ok) throw new Error('failed to save blocklist')
  return r.json()
}