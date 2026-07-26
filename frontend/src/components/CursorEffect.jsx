import { useEffect, useRef } from 'react'

/**
 * Two effects in one component:
 * 1. A soft glowing dot that trails the mouse cursor (desktop) — subtle,
 *    themed via var(--trace), disabled under prefers-reduced-motion.
 * 2. A tap "ripple" on any element with the `data-ripple` attribute, for
 *    touch feedback (works for mouse clicks too).
 */
export default function CursorEffect() {
  const dotRef = useRef(null)
  const pos = useRef({ x: 0, y: 0 })
  const current = useRef({ x: 0, y: 0 })
  const rafRef = useRef(null)

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isTouch = window.matchMedia('(pointer: coarse)').matches
    if (prefersReduced || isTouch) return // skip on touch devices / reduced motion

    function onMove(e) {
      pos.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('mousemove', onMove)

    function loop() {
      current.current.x += (pos.current.x - current.current.x) * 0.15
      current.current.y += (pos.current.y - current.current.y) * 0.15
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${current.current.x - 12}px, ${current.current.y - 12}px)`
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // Ripple effect delegate — listens once at document level for any
  // [data-ripple] element, so no per-button wiring needed.
  useEffect(() => {
    function onClick(e) {
      const target = e.target.closest('[data-ripple]')
      if (!target) return
      const rect = target.getBoundingClientRect()
      const ripple = document.createElement('span')
      const size = Math.max(rect.width, rect.height)
      ripple.style.cssText = `
        position:absolute; border-radius:50%; pointer-events:none;
        background: color-mix(in srgb, var(--trace) 35%, transparent);
        width:${size}px; height:${size}px;
        left:${e.clientX - rect.left - size / 2}px; top:${e.clientY - rect.top - size / 2}px;
        transform: scale(0); opacity: 1;
        animation: ns-ripple 0.5s ease-out forwards;
      `
      const computedPos = getComputedStyle(target).position
      if (computedPos === 'static') target.style.position = 'relative'
      target.style.overflow = 'hidden'
      target.appendChild(ripple)
      setTimeout(() => ripple.remove(), 520)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  return (
    <>
      <div
        ref={dotRef}
        className="fixed top-0 left-0 w-6 h-6 rounded-full pointer-events-none z-[9999] hidden md:block"
        style={{
          background: 'radial-gradient(circle, var(--trace) 0%, transparent 70%)',
          opacity: 0.5,
          mixBlendMode: 'screen',
          filter: 'blur(1px)',
        }}
      />
      <style>{`
        @keyframes ns-ripple {
          to { transform: scale(2.2); opacity: 0; }
        }
      `}</style>
    </>
  )
}
