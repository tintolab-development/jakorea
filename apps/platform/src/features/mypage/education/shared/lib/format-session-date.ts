import { formatDisplayDate } from '../../../../../shared/lib/format-display-date.ts'

/** 2026년 4월 3일(금) */
export function formatEducationSessionDate(iso: string): string {
  return formatDisplayDate(iso) || iso
}
