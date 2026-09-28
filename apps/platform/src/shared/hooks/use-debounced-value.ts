import { useEffect, useState } from 'react'

/**
 * `value` 가 `delayMs` 동안 바뀌지 않으면 같은 값을 반환한다.
 * 검색 인풋 → API/URL 반영 지연에 쓴다.
 */
export function useDebouncedValue<T>(value: T, delayMs = 500): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebounced(value)
    }, delayMs)
    return () => window.clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
