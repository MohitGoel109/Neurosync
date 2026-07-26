import { useRef, useState, useCallback, useEffect } from 'react'
import { computeFocusScoreBreakdown } from './focusScore'
import { API_BASE } from './config'

const CALIBRATION_MS = 1200
const YAW_THRESHOLD = 15
const PITCH_THRESHOLD = 12
const POST_INTERVAL_MS = 2000
const WPM_WINDOW_SECONDS = 10

const WASM_BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm'
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'

function extractYawPitch(matrixData) {
  const m = (r, c) => matrixData[r + c * 4]
  const r20 = m(2, 0), r21 = m(2, 1), r22 = m(2, 2)
  const yaw = Math.atan2(r20, r22) * (180 / Math.PI)
  const pitch = Math.asin(Math.max(-1, Math.min(1, -r21))) * (180 / Math.PI)
  return { yaw, pitch }
}

export function useBrowserTracking() {
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)

  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const landmarkerRef = useRef(null)
  const rafRef = useRef(null)
  const postTimerRef = useRef(null)

  const baseline = useRef(null)
  const keyTimestamps = useRef([])
  const lastActivity = useRef(Date.now())
  const mouseEventCount = useRef(0)
  const latestAttention = useRef(false)
  const tabHidden = useRef(false)

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    clearInterval(postTimerRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    document.removeEventListener('keydown', onKeyDown)
    document.removeEventListener('mousemove', onMouseActivity)
    document.removeEventListener('mousedown', onMouseActivity)
    document.removeEventListener('visibilitychange', onVisibilityChange)
    baseline.current = null
    setStatus('idle')
  }, [])

  function onKeyDown() {
    const now = Date.now()
    keyTimestamps.current.push(now)
    lastActivity.current = now
    const cutoff = now - WPM_WINDOW_SECONDS * 1000
    keyTimestamps.current = keyTimestamps.current.filter((t) => t > cutoff)
  }

  function onMouseActivity() {
    mouseEventCount.current += 1
    lastActivity.current = Date.now()
  }

  function onVisibilityChange() {
    tabHidden.current = document.hidden
  }

  const start = useCallback(async () => {
    setError(null)
    setStatus('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } })
      streamRef.current = stream
      const video = document.createElement('video')
      video.srcObject = stream
      video.playsInline = true
      video.muted = true
      await video.play()
      videoRef.current = video

      const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision')
      const filesetResolver = await FilesetResolver.forVisionTasks(WASM_BASE)
      landmarkerRef.current = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
        outputFacialTransformationMatrixes: true,
        runningMode: 'VIDEO',
        numFaces: 1,
      })

      document.addEventListener('keydown', onKeyDown)
      document.addEventListener('mousemove', onMouseActivity)
      document.addEventListener('mousedown', onMouseActivity)
      document.addEventListener('visibilitychange', onVisibilityChange)

      setStatus('calibrating')
      const calibrationSamples = []
      const calibrationStart = performance.now()

      function detectLoop() {
        const video = videoRef.current
        const landmarker = landmarkerRef.current
        if (!video || !landmarker) return

        const result = landmarker.detectForVideo(video, performance.now())
        const matrix = result?.facialTransformationMatrixes?.[0]?.data

        if (matrix) {
          const { yaw, pitch } = extractYawPitch(matrix)

          if (performance.now() - calibrationStart < CALIBRATION_MS) {
            calibrationSamples.push({ yaw, pitch })
          } else if (!baseline.current) {
            const avg = (key) =>
              calibrationSamples.reduce((s, v) => s + v[key], 0) / (calibrationSamples.length || 1)
            baseline.current = { yaw: avg('yaw'), pitch: avg('pitch') }
            setStatus('active')
          } else {
            const dYaw = Math.abs(yaw - baseline.current.yaw)
            const dPitch = Math.abs(pitch - baseline.current.pitch)
            latestAttention.current = dYaw < YAW_THRESHOLD && dPitch < PITCH_THRESHOLD && !tabHidden.current
          }
        } else {
          latestAttention.current = false
        }

        rafRef.current = requestAnimationFrame(detectLoop)
      }
      rafRef.current = requestAnimationFrame(detectLoop)

      postTimerRef.current = setInterval(async () => {
        const now = Date.now()
        const wpm = (keyTimestamps.current.length / 5) * (60 / WPM_WINDOW_SECONDS)
        const idleSeconds = (now - lastActivity.current) / 1000
        const isDistraction = tabHidden.current

        const breakdown = computeFocusScoreBreakdown({
          attention: latestAttention.current,
          typingWpm: wpm,
          idleSeconds,
          isDistraction,
        })

        try {
          await fetch(`${API_BASE}/api/readings/browser`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              attention: latestAttention.current,
              typing_speed_wpm: Math.round(wpm * 10) / 10,
              idle_seconds: Math.round(idleSeconds * 10) / 10,
              mouse_events: mouseEventCount.current,
              active_app: isDistraction ? 'switched away from tab' : 'this browser tab',
              is_distraction: isDistraction,
              focus_score: breakdown.total,
              score_components: breakdown,
            }),
          })
        } catch {
          // best-effort
        }
        mouseEventCount.current = 0
      }, POST_INTERVAL_MS)
    } catch (err) {
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setStatus('denied')
      } else {
        setError(err?.message || 'Failed to start browser tracking')
        setStatus('error')
      }
    }
  }, [])

  useEffect(() => stop, [stop])

  return { status, error, start, stop }
}