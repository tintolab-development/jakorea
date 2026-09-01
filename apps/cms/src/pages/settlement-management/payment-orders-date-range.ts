import dayjs, { type Dayjs } from 'dayjs'

/** 최초 진입·URL 기본값: 당월 1일 ~ 익월 1일 */
export function getPaymentOrdersDefaultDateRange(): [Dayjs, Dayjs] {
  const start = dayjs().startOf('month')
  return [start, start.add(1, 'month')]
}

export function getPaymentOrdersDefaultDateRangeParams(): { from: string; to: string } {
  const [start, end] = getPaymentOrdersDefaultDateRange()
  return {
    from: start.format('YYYY-MM-DD'),
    to: end.format('YYYY-MM-DD'),
  }
}

/** 강의 출강일 필터 — 시작일 선택 시 해당 일로부터 한 달(익월 동일일) */
export function getPaymentOrdersOneMonthRangeFrom(start: Dayjs): [Dayjs, Dayjs] {
  const normalized = start.startOf('day')
  return [normalized, normalized.add(1, 'month')]
}

/** 캘린더 월 이동·날짜 선택 시 상단 기간 필터와 동일한 한 달 구간 */
export function getPaymentOrdersMonthFilterRange(anchor: Dayjs): [Dayjs, Dayjs] {
  return getPaymentOrdersOneMonthRangeFrom(anchor.startOf('month'))
}

/** 조회 적용된 출강일(또는 데이터 앵커) → 캘린더·필터 공통 월간 구간 */
export function resolvePaymentOrdersCalendarFilterRange(
  appliedRange: [Dayjs, Dayjs] | null | undefined,
  fallbackAnchor: Dayjs
): [Dayjs, Dayjs] {
  const anchor =
    appliedRange?.[0]?.isValid() && appliedRange[1]?.isValid()
      ? appliedRange[0]
      : fallbackAnchor.startOf('day')
  return getPaymentOrdersMonthFilterRange(anchor)
}

export function isSamePaymentOrdersDateRange(
  a: [Dayjs, Dayjs] | null | undefined,
  b: [Dayjs, Dayjs] | null | undefined
): boolean {
  if (!a?.[0] || !a[1] || !b?.[0] || !b[1]) return false
  return a[0].isSame(b[0], 'day') && a[1].isSame(b[1], 'day')
}

/** 예전 시드 URL(2025) — 기본 기간으로 치환하기 전에는 목록 API를 치지 않는다. */
export function isPaymentOrdersLegacyPlaceholderDateRange(
  from: string | null,
  to: string | null
): boolean {
  return Boolean(from && to && from.startsWith('2025-') && to.startsWith('2025-'))
}

/** 기본 출강일(또는 조회 기간)이 URL에 반영된 뒤에만 aggregates를 호출한다. */
export function isPaymentOrdersListDateRangeReady(
  from: string | null,
  to: string | null
): boolean {
  if (!from || !to) return false
  return !isPaymentOrdersLegacyPlaceholderDateRange(from, to)
}
