import { useEffect, useMemo, useRef, useState } from 'react'

export function useDebouncedValue(value, delayMs) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])
  return debounced
}

// Returns a function that waits for `delayMs` of quiet before calling `callback` with the last arguments
export function useDebouncedCallback(callback, delayMs) {
  const timer = useRef(null)
  const latest = useRef(callback)
  useEffect(() => {
    latest.current = callback
  })
  useEffect(() => () => clearTimeout(timer.current), [])

  return useMemo(
    () => (...args) => {
      clearTimeout(timer.current)
      timer.current = setTimeout(() => latest.current?.(...args), delayMs)
    },
    [delayMs]
  )
}
