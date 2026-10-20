/**
 * 일반 기관 합반 — 교육일(Asia/Seoul YYYY-MM-DD) 집합.
 * 제출일·승인일·라벨 파싱은 쓰지 않는다.
 */

export type CombinedClassEducationDateSource = {
  sessions?: Array<{ startAt?: string | null }>
  confirmedListAssignmentSessions?: Array<{ startAt?: string | null }>
  hopeEducationSessions?: Array<{ startAt?: string | null }>
  preferredEducationSchedules?: Array<{ startAt?: string | null }>
  preferredEducationDates?: string[]
}

const SEOUL_DATE_FORMAT = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export function toSeoulDateKey(value: string | null | undefined): string | null {
  if (value == null) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
  const parsed = Date.parse(trimmed)
  if (!Number.isFinite(parsed)) return null
  return SEOUL_DATE_FORMAT.format(new Date(parsed))
}

function uniqueSortedDates(dates: string[]): string[] {
  return [...new Set(dates)].sort()
}

function datesFromStartAts(items: Array<{ startAt?: string | null }>): string[] {
  const dates: string[] = []
  for (const item of items) {
    const key = toSeoulDateKey(item.startAt)
    if (key) dates.push(key)
  }
  return uniqueSortedDates(dates)
}

function datesFromPreferredEducationDates(values: string[] | undefined): string[] {
  if (!values?.length) return []
  const dates: string[] = []
  for (const value of values) {
    const key = toSeoulDateKey(value)
    if (key) dates.push(key)
  }
  return uniqueSortedDates(dates)
}

/** OSA 배정이 있으면 그 날짜, 없으면 희망일. 없으면 빈 배열. */
export function collectCombinedClassEducationDates(
  source: CombinedClassEducationDateSource | null | undefined
): string[] {
  if (!source) return []

  const confirmed = datesFromStartAts(source.confirmedListAssignmentSessions ?? [])
  if (confirmed.length > 0) return confirmed

  const assigned = datesFromStartAts(source.sessions ?? [])
  if (assigned.length > 0) return assigned

  const preferredDates = datesFromPreferredEducationDates(source.preferredEducationDates)
  if (preferredDates.length > 0) return preferredDates

  const hope = datesFromStartAts(source.hopeEducationSessions ?? [])
  if (hope.length > 0) return hope

  return datesFromStartAts(source.preferredEducationSchedules ?? [])
}

export function areCombinedClassEducationDateSetsEqual(
  left: readonly string[],
  right: readonly string[]
): boolean {
  if (left.length === 0 || right.length === 0) return false
  if (left.length !== right.length) return false
  return left.every((date, index) => date === right[index])
}

export function canMergeCombinedClassByEducationDate(
  lead: CombinedClassEducationDateSource | null | undefined,
  partner: CombinedClassEducationDateSource | null | undefined
): boolean {
  return areCombinedClassEducationDateSetsEqual(
    collectCombinedClassEducationDates(lead),
    collectCombinedClassEducationDates(partner)
  )
}

export function retainMatchingCombinedClassPartnerIds<
  T extends CombinedClassEducationDateSource & { id: string },
>(
  lead: CombinedClassEducationDateSource,
  rows: readonly T[],
  selectedIds: readonly string[]
): string[] {
  return selectedIds.filter(id => {
    const partner = rows.find(row => row.id === id)
    return partner != null && canMergeCombinedClassByEducationDate(lead, partner)
  })
}
