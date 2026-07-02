import { useEffect, useRef, useState } from 'react'

export function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(target)
  const prevTarget = useRef(target)

  useEffect(() => {
    const from = prevTarget.current
    const to = target
    prevTarget.current = target
    if (from === to) return

    let raf
    const start = performance.now()
    function tick(now) {
      const p = Math.min(1, (now - start) / duration)
      const eased = 1 - (1 - p) ** 3
      setValue(from + (to - from) * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration])

  return value
}
