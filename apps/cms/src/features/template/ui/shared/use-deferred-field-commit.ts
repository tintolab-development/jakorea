import { startTransition, useEffect, useEffectEvent, useRef, useState } from 'react'

const DEFAULT_COMMIT_DELAY_MS = 120

/**
 * 타이핑 중 상위 draft 동기 갱신으로 무거운 에디터 트리가 버벅일 때 사용.
 * - 로컬 값은 즉시 반영
 * - 상위 `onCommit`은 debounce + startTransition
 * - blur/unmount 시 pending 값 flush
 */
export function useDeferredFieldCommit(
  committedValue: string,
  onCommit: ((next: string) => void) | undefined,
  delayMs: number = DEFAULT_COMMIT_DELAY_MS
): {
  value: string
  setValue: (next: string) => void
  flush: () => void
} {
  const [value, setValueState] = useState(committedValue)
  const valueRef = useRef(value)
  const committedRef = useRef(committedValue)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = () => {
    if (timerRef.current == null) return
    clearTimeout(timerRef.current)
    timerRef.current = null
  }

  const commitNow = useEffectEvent((next: string) => {
    if (!onCommit) return
    if (next === committedRef.current) return
    committedRef.current = next
    startTransition(() => {
      onCommit(next)
    })
  })

  useEffect(() => {
    if (committedValue === committedRef.current && committedValue === valueRef.current) return
    // 외부(저장본 로드·다른 필드)에서 committed가 바뀐 경우만 로컬 동기화
    if (committedValue !== committedRef.current) {
      clearTimer()
      committedRef.current = committedValue
      valueRef.current = committedValue
      setValueState(committedValue)
    }
  }, [committedValue])

  const flushOnUnmount = useEffectEvent(() => {
    clearTimer()
    const pending = valueRef.current
    if (!onCommit || pending === committedRef.current) return
    committedRef.current = pending
    onCommit(pending)
  })

  useEffect(() => {
    return () => {
      flushOnUnmount()
    }
  }, [])

  const flush = () => {
    clearTimer()
    commitNow(valueRef.current)
  }

  const setValue = (next: string) => {
    valueRef.current = next
    setValueState(next)
    if (!onCommit) return
    clearTimer()
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      commitNow(valueRef.current)
    }, delayMs)
  }

  return { value, setValue, flush }
}
