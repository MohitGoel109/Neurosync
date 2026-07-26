// Mirrors agent/focus_score.py exactly, so a browser-tracked reading and a
// local-agent reading are scored identically and comparably.
const WEIGHTS = { attention: 0.45, typing: 0.20, idlePenalty: 0.20, distraction: 0.15 }
const IDEAL_WPM = 40
const IDLE_GRACE_SECONDS = 15
const IDLE_MAX_SECONDS = 120

export function computeFocusScoreBreakdown({ attention, typingWpm, idleSeconds, isDistraction }) {
  const attentionComponent = attention ? 1 : 0
  const typingComponent = Math.min(typingWpm / IDEAL_WPM, 1)

  let idleComponent
  if (idleSeconds <= IDLE_GRACE_SECONDS) {
    idleComponent = 1
  } else {
    const span = IDLE_MAX_SECONDS - IDLE_GRACE_SECONDS
    idleComponent = Math.max(0, 1 - (idleSeconds - IDLE_GRACE_SECONDS) / span)
  }

  const distractionComponent = isDistraction ? 0 : 1

  const parts = {
    attention: round1(WEIGHTS.attention * attentionComponent * 100),
    typing: round1(WEIGHTS.typing * typingComponent * 100),
    idle: round1(WEIGHTS.idlePenalty * idleComponent * 100),
    distraction: round1(WEIGHTS.distraction * distractionComponent * 100),
  }
  parts.total = round1(parts.attention + parts.typing + parts.idle + parts.distraction)
  return parts
}

function round1(n) {
  return Math.round(n * 10) / 10
}