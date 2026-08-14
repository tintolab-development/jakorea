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
  const useGrouping = value.includes(',')
  const target = Number(value.replaceAll(',', ''))
  const isNumeric = Number.isFinite(target)
  const display = useCountUp({
    target: isNumeric ? target : 0,
    enabled: enabled && isNumeric,
    immediate,
    useGrouping,
  })

  return <span className={className}>{isNumeric ? display : value}</span>
}
