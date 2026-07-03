import { useCallback, useRef, useState } from 'react'

export function useTransientMessage(duration = 2500) {
  const [message, setMessage] = useState(null)
  const timeoutRef = useRef(null)

  const show = useCallback(
    (text) => {
      setMessage(text)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => setMessage(null), duration)
    },
    [duration],
  )

  return [message, show]
}
