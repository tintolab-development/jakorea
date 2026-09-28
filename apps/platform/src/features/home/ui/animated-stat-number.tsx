import { useRef } from 'react'
import { useCountUp } from '../lib/use-count-up'

type AnimatedStatNumberProps = {
  value: string
  className: string
  enabled: boolean
  immediate: boolean
}

export function AnimatedStatNumber({
  value,
  className,
  enabled,
  immediate,
}: AnimatedStatNumberProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const useGrouping = value.includes(',')
  const target = Number(value.replaceAll(',', ''))
  const isNumeric = Number.isFinite(target)

  useCountUp(ref, {
    target: isNumeric ? target : 0,
    enabled: enabled && isNumeric,
    immediate,
    useGrouping,
    active: isNumeric,
  })

  // 숫자는 RAF로 textContent만 갱신 — React children과 겹치지 않게 비운다.
  if (isNumeric) {
    return <span ref={ref} className={className} />
  }

  return (
    <span ref={ref} className={className}>
      {value}
    </span>
  )
}
