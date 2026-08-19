import { formatDateRangeDot } from '@/shared/utils'

/** 목록 기간 — YYYY.MM.DD ~ YYYY.MM.DD */
export const formatDateRange = (start?: string | Date, end?: string | Date): string => {
  return formatDateRangeDot(start, end)
}
