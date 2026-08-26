/** 조회수 표시 — 없으면 0, 천단위 구분 */
import { formatNumberDisplay } from '@/shared/lib/format-display'

export function formatCount(value: number | undefined | null): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '0'
  return formatNumberDisplay(value)
}
