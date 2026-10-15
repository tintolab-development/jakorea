import type { Dayjs } from 'dayjs'

export type SplitDateRangeTuple = [Dayjs | null, Dayjs | null]

export function applySplitDateRangeStartChange(
  end: Dayjs | null,
  newStart: Dayjs | null
): SplitDateRangeTuple {
  if (newStart == null) return [null, end]
  if (end == null) return [newStart, null]
  if (newStart.isAfter(end, 'day')) return [newStart, newStart]
  return [newStart, end]
}

export function applySplitDateRangeEndChange(
  start: Dayjs | null,
  newEnd: Dayjs | null
): SplitDateRangeTuple {
  if (newEnd == null) return [start, null]
  if (start == null) return [null, newEnd]
  if (newEnd.isBefore(start, 'day')) return [newEnd, start]
  return [start, newEnd]
}
