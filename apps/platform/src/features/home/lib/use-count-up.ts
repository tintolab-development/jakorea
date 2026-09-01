import { useEffect, useState } from 'react'

const DEFAULT_DURATION_MS = 4000

type UseCountUpOptions = {
  target: number
  enabled: boolean
  /** 애니메이션 없이 목표값으로 바로 표시 (reduced motion) */
  immediate?: boolean
  durationMs?: number
  useGrouping?: boolean
}

function easeOutCubic(progress: number): number {
  return 1 - (1 - progress) ** 3
}

function formatCount(value: number, useGrouping: boolean): string {
  return useGrouping ? value.toLocaleString('en-US') : String(value)
}

export function useCountUp({
  target,
  enabled,
  immediate = false,
  durationMs = DEFAULT_DURATION_MS,
  useGrouping = false,
}: UseCountUpOptions): string {
  const [value, setValue] = useState(immediate ? target : 0)

  useEffect(() => {
    if (!enabled) return

    if (immediate) {
      setValue(target)
      return
    }

    let rafId = 0
    const start = performance.now()

    function tick(now: number) {
      const progress = Math.min((now - start) / durationMs, 1)
      setValue(Math.round(target * easeOutCubic(progress)))
      if (progress < 1) {
        rafId = requestAnimationFrame(tick)
      }
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [durationMs, enabled, immediate, target])

  return formatCount(value, useGrouping)
}
