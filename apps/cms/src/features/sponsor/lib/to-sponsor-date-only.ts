import type { Dayjs } from 'dayjs'

/** Local calendar date for BE LocalDate fields. Do not convert via UTC ISO. */
export function toSponsorDateOnly(date: Dayjs | null): string | undefined {
  if (!date) return undefined
  return date.format('YYYY-MM-DD')
}
