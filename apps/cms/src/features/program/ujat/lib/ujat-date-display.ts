import dayjs, { type Dayjs } from 'dayjs'
import { formatYmdCompactNoSpaceWithKoreanWeekday } from '@/shared/lib/format-date-korean-weekday'

/** UJAT 모집·상세 — `YYYY.MM.DD(금)` */
export function formatUjatDotDateWithWeekday(value: string | Date | Dayjs): string {
  const d = dayjs(value)
  if (!d.isValid()) return ''
  return formatYmdCompactNoSpaceWithKoreanWeekday(d)
}
