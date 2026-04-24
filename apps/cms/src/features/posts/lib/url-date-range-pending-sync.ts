import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'

/** 분할 기간 필터 pending — 한쪽만 선택된 중간 상태 허용 */
export type AdminPostsPendingDateRange = [Dayjs, Dayjs] | [Dayjs | null, Dayjs | null] | null

/**
 * TableFilterGroup → `onFilterChange('dateRange', value)` 값을 pending에 저장할 형태로 정규화.
 * 기존 `range?.[0] && range?.[1]` 조건은 시작일만 고르면 `null`이 되어 입력이 즉시 풀림.
 */
export function normalizeDateRangePickerValueToPending(value: unknown): AdminPostsPendingDateRange {
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
  prev: AdminPostsPendingDateRange | undefined
}): [Dayjs, Dayjs] | null | [Dayjs | null, Dayjs | null] {
  const { ref, from, to, prev } = args
  const hasCompleteInUrl = Boolean(from && to)

  if (hasCompleteInUrl) {
    ref.hadCompleteInUrl = true
    return [dayjs(from!), dayjs(to!)]
  }

  if (ref.hadCompleteInUrl && !hasCompleteInUrl) {
    ref.hadCompleteInUrl = false
    return null
  }

  return prev ?? null
}

/** pending 기간(중간 null 허용) 동일 여부 — URL sync 시 불필요한 setState 방지 */
export function pendingDateRangeTupleEqual(
  a: AdminPostsPendingDateRange | undefined,
  b: AdminPostsPendingDateRange | undefined
): boolean {
  if (a == null && b == null) return true
  if (a == null || b == null) return false
  const av0 = a[0]?.valueOf() ?? null
  const av1 = a[1]?.valueOf() ?? null
  const bv0 = b[0]?.valueOf() ?? null
  const bv1 = b[1]?.valueOf() ?? null
  return av0 === bv0 && av1 === bv1
}
