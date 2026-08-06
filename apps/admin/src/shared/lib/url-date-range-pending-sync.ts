/**
 * URL from/to ↔ pending date range 동기화.
 * CMS `url-date-range-pending-sync` 축소 이식.
 */

import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'

/** 분할 기간 필터 pending — 한쪽만 선택된 중간 상태 허용 */
export type PendingDateRange = [Dayjs, Dayjs] | [Dayjs | null, Dayjs | null] | null

/** DateRangePicker → pending 정규화 */
export function normalizeDateRangePickerValueToPending(value: unknown): PendingDateRange {
  if (value == null) return null
  if (!Array.isArray(value) || value.length < 2) return null
  const a = (value[0] ?? null) as Dayjs | null
  const b = (value[1] ?? null) as Dayjs | null
  if (a == null && b == null) return null
  if (a != null && b != null) return [a, b]
  return [a, b]
}

/** `syncPendingFromUrl` 모듈 간 공유 — URL에 from·to가 모두 있었는지 추적 */
export type UrlDateRangePendingSyncRef = { hadCompleteInUrl: boolean }

export function resolvePendingDateRangeFromUrl(args: {
  ref: UrlDateRangePendingSyncRef
  from: string | null
  to: string | null
  prev: PendingDateRange | undefined
}): [Dayjs, Dayjs] | null | [Dayjs | null, Dayjs | null] {
  const { ref, from, to, prev } = args
  const hasCompleteInUrl = Boolean(from && to)

  if (hasCompleteInUrl) {
    ref.hadCompleteInUrl = true
    return [dayjs(from!), dayjs(to!)]
  }

  // single-side URL support
  if (from || to) {
    ref.hadCompleteInUrl = false
    return [from ? dayjs(from) : null, to ? dayjs(to) : null]
  }

  if (ref.hadCompleteInUrl && !hasCompleteInUrl) {
    ref.hadCompleteInUrl = false
    return null
  }

  return prev ?? null
}

/** pending 기간 동일 여부 — URL sync 시 불필요한 setState 방지 */
export function pendingDateRangeTupleEqual(
  a: PendingDateRange | undefined,
  b: PendingDateRange | undefined
): boolean {
  if (a == null && b == null) return true
  if (a == null || b == null) return false
  const av0 = a[0]?.valueOf() ?? null
  const av1 = a[1]?.valueOf() ?? null
  const bv0 = b[0]?.valueOf() ?? null
  const bv1 = b[1]?.valueOf() ?? null
  return av0 === bv0 && av1 === bv1
}

/** URL from/to 키에 pending range write (한 칸이라도 있으면 기록) */
export function applyDateRangeToSearchParams(
  nextParams: URLSearchParams,
  range: PendingDateRange | undefined,
  fromKey: string,
  toKey: string
): void {
  const start = range?.[0]
  const end = range?.[1]
  if (start) {
    nextParams.set(fromKey, start.format('YYYY-MM-DD'))
  } else {
    nextParams.delete(fromKey)
  }
  if (end) {
    nextParams.set(toKey, end.format('YYYY-MM-DD'))
  } else {
    nextParams.delete(toKey)
  }
}

/** URL → applied filter용 YYYY-MM-DD 문자열 */
export function ymdFromParam(raw: string | null): string | undefined {
  if (!raw?.trim()) return undefined
  const d = dayjs(raw.trim())
  if (!d.isValid()) return undefined
  return d.format('YYYY-MM-DD')
}
