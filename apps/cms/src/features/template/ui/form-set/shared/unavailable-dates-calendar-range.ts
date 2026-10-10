import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'

export function normalizeRangeSealToLocalDayBounds(
  seal: { start: string; end: string } | null | undefined
): [Dayjs, Dayjs] | null {
  if (seal?.start == null || seal?.end == null) return null
  const start = dayjs(seal.start).startOf('day')
  const end = dayjs(seal.end).startOf('day')
  if (!start.isValid() || !end.isValid()) return null
  return start.isAfter(end, 'day') ? [end, start] : [start, end]
}

export function isOutsideInclusiveLocalDayRange(
  date: Dayjs,
  range: [Dayjs, Dayjs] | null | undefined
): boolean {
  if (range == null) return true
  const [start, end] = range
  const d = date.startOf('day')
  return d.isBefore(start, 'day') || d.isAfter(end, 'day')
}
