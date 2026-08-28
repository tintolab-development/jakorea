import { GLOBAL_VALUE_COUNT } from './global-value-data'

/**
 * Section scroll progress(0~1) → accordion frontier index(0~count-1).
 * index < frontier → 접힘, index >= frontier → 펼침
 * (진입 시 0 = 전체 펼침, 스크롤 다운 시 위에서부터 순차 접힘 / 업은 역순)
 */
export function resolveActiveValueIndex(progress: number, count = GLOBAL_VALUE_COUNT): number {
  if (count <= 0) return 0
  if (progress <= 0) return 0
  if (progress >= 1) return count - 1
  return Math.min(count - 1, Math.floor(progress * count))
}
