import { useEffect, useRef, useState } from 'react'

const API_BASE = 'http://localhost:8000'

export function useLiveFocus() {
  const [focusScore, setFocusScore] = useState(0)
  const [alerts, setAlerts] = useState([])
  const [pings, setPings] = useState([])
  const [timeline, setTimeline] = useState([])
  const [connected, setConnected] = useState(false)
  const distractionStreak = useRef(0)

  async function refetchTimeline() {
    try {
      const r = await fetch(`${API_BASE}/api/stats/hourly`)
      setTimeline(await r.json())
    } catch {
      // backend not reachable yet — leave existing timeline as-is
    }
  }

  // Initial timeline load
  useEffect(() => {
    refetchTimeline()
  }, [])

  // Live WebSocket feed
  useEffect(() => {
    let ws
    let retryTimer

    function connect() {
      ws = new WebSocket(`ws://localhost:8000/ws/live`)
      ws.onopen = () => setConnected(true)
      ws.onclose = () => {
        setConnected(false)
        retryTimer = setTimeout(connect, 2000)
      }
      ws.onmessage = (event) => {
        const reading = JSON.parse(event.data)
        setFocusScore(reading.focus_score)

        if (reading.is_distraction) {
          distractionStreak.current += 1
          setPings((prev) => [
            { id: Date.now(), angle: Math.random() * 360, opacity: 0.9 },
            ...prev.slice(0, 5),
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
    return () => {
      ws?.close()
      clearTimeout(retryTimer)
    }
  }, [])

  return { focusScore, alerts, pings, timeline, connected, refetchTimeline }
}

export async function seedSimulatedData(hours = 3) {
  await fetch(`${API_BASE}/api/simulate/seed?hours=${hours}`, { method: 'POST' })
}
