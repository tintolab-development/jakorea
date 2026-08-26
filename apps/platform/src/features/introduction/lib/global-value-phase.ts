import { GLOBAL_VALUE_COUNT } from './global-value-data'

/**
 * Section scroll progress(0~1) → active value index(0~count-1).
 * 구간을 균등 분할하며, 경계에서 clamp로 안정화.
 */
export function resolveActiveValueIndex(progress: number, count = GLOBAL_VALUE_COUNT): number {
  if (count <= 0) return 0
  if (progress <= 0) return 0
  if (progress >= 1) return count - 1
  return Math.min(count - 1, Math.floor(progress * count))
}
