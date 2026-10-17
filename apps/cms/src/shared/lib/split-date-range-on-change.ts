import type { Dayjs } from 'dayjs'

export type SplitDateRangeTuple = [Dayjs | null, Dayjs | null]

/**
 * 분리형 시작일 DatePicker 변경 — `ParagraphDatePicker` 시작 필드 포커스와 동일.
 * 시작일이 종료일(일 단위)보다 뒤면 종료를 시작일로 당긴다.
 */
export function applySplitDateRangeStartChange(
  end: Dayjs | null,
  newStart: Dayjs | null
): SplitDateRangeTuple {
  if (newStart == null) return [null, end]
  if (end == null) return [newStart, null]
  if (newStart.isAfter(end, 'day')) return [newStart, newStart]
  return [newStart, end]
}

/**
 * 분리형 종료일 DatePicker 변경 — 종료가 시작보다 앞(일 단위)이면 [이른 날, 늦은 날]로 정렬.
 */
export function applySplitDateRangeEndChange(
  start: Dayjs | null,
  newEnd: Dayjs | null
): SplitDateRangeTuple {
  if (newEnd == null) return [start, null]
  if (start == null) return [null, newEnd]
  if (newEnd.isBefore(start, 'day')) return [newEnd, start]
  return [start, newEnd]
}
