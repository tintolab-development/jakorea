/**
 * 연혁·수상·인증 공통 표시 포맷
 */
export {
  formatDateDot as formatYmdDot,
  formatDateTimeDot as formatCreatedDateTime,
} from '@/shared/lib/format-display'

export function formatYearMonth(year: number, month: number): string {
  if (!year || !month) return '-'
  return `${year}.${String(month).padStart(2, '0')}`
}

export function coerceRadioBoolean(raw: unknown): boolean {
  if (raw === true || raw === 1) return true
  if (raw === false || raw === 0) return false
  if (typeof raw === 'string') {
    const s = raw.toLowerCase()
    if (s === 'true' || s === '1') return true
    if (s === 'false' || s === '0') return false
  }
  return Boolean(raw)
}
