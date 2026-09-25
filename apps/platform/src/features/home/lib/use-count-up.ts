import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react'

const DEFAULT_DURATION_MS = 4000

type UseCountUpOptions = {
  target: number
  enabled: boolean
  /** 애니메이션 없이 목표값으로 바로 표시 (reduced motion) */
  immediate?: boolean
  durationMs?: number
  useGrouping?: boolean
  /** false면 DOM을 건드리지 않는다 (숫자가 아닌 라벨) */
  active?: boolean
}

function easeOutCubic(progress: number): number {
  return 1 - (1 - progress) ** 3
}

export function formatCountUp(value: number, useGrouping: boolean): string {
  return useGrouping ? value.toLocaleString('en-US') : String(value)
}

export function useCountUp(
  ref: RefObject<HTMLElement | null>,
  {
    target,
    enabled,
    immediate = false,
    durationMs = DEFAULT_DURATION_MS,
    useGrouping = false,
    active = true,
  }: UseCountUpOptions,
) {
  const displayedRef = useRef(immediate ? target : 0)

  useLayoutEffect(() => {
    const node = ref.current
    if (!node || !active) return
    node.textContent = formatCountUp(displayedRef.current, useGrouping)
  }, [active, ref, useGrouping])

  useEffect(() => {
    const node = ref.current
    if (!node || !active || !enabled) return

    if (immediate) {
      displayedRef.current = target
      node.textContent = formatCountUp(target, useGrouping)
      return
    }

    let rafId = 0
    const start = performance.now()
    displayedRef.current = 0
    node.textContent = formatCountUp(0, useGrouping)

    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1)
      const next = Math.round(target * easeOutCubic(progress))
      displayedRef.current = next
      node.textContent = formatCountUp(next, useGrouping)
      if (progress < 1) {
        rafId = requestAnimationFrame(tick)
      }
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [active, durationMs, enabled, immediate, ref, target, useGrouping])
}
