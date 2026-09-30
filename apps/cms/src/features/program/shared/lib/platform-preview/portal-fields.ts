/**
 * CMS 편집값 → Portal 상세 응답(`PortalProgramDetail`) 필드 변환 — 유형 공통
 */

import type { PortalSchedule } from '@jakorea/domain/portal/program-detail'
import type { DateValue } from '@/types'

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

function formatLocalDateTime(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(
    date.getHours()
  )}:${pad2(date.getMinutes())}:00`
}

/** Portal `startAt`·`businessStartDate` 등 — 로컬 시각 ISO(오프셋 없음). 파싱 불가면 undefined */
export function toPortalDateTime(value: DateValue | null | undefined): string | undefined {
  if (value == null) return undefined
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : formatLocalDateTime(value)
  }
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const dateOnly = trimmed.match(/^(\d{4})[-.](\d{1,2})[-.](\d{1,2})$/)
  if (dateOnly) {
    return `${dateOnly[1]}-${pad2(Number(dateOnly[2]))}-${pad2(Number(dateOnly[3]))}T00:00:00`
  }
  const parsed = new Date(trimmed)
  return Number.isNaN(parsed.getTime()) ? undefined : formatLocalDateTime(parsed)
}

export function trimmedOrUndefined(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

export function firstTrimmed(...values: Array<string | null | undefined>): string | undefined {
  for (const value of values) {
    const trimmed = trimmedOrUndefined(value)
    if (trimmed) return trimmed
  }
  return undefined
}

/** 등록 폼 교육 형태(값·라벨 혼용) → Portal `operationMethod` */
export function toPortalOperationMethod(value: string | null | undefined): string | undefined {
  const normalized = value?.trim().toLowerCase().replace(/\s+/g, '')
  if (!normalized) return undefined
  switch (normalized) {
    case 'online':
    case '온라인':
      return 'ONLINE'
    case 'offline':
    case '오프라인':
      return 'OFFLINE'
    case 'hybrid':
    case '온/오프라인':
    case '온·오프라인':
    case '온오프라인':
      return 'HYBRID'
    case 'participant_selection':
    case 'participant_choice':
    case '참여자선택':
      return 'PARTICIPANT_CHOICE'
    default:
      return undefined
  }
}

const SCHEDULE_DATE_PATTERN =
  /(\d{4})\s*(?:년\s*|[-.]\s*)(\d{1,2})\s*(?:월\s*|[-.]\s*)(\d{1,2})\s*일?(?:\s*\([^)]*\))?(?:\s*(\d{1,2}):(\d{2}))?/g

/**
 * 일정 표시 라벨(`2026년 9월 1일(화) 09:00 ~ 12:00`, `2026.09.01 ~ 2026.09.03`)에서
 * 첫·마지막 날짜를 `startAt`/`endAt`으로 뽑는다. 날짜가 없으면 null.
 */
export function parseScheduleLabelRange(
  label: string | null | undefined
): Pick<PortalSchedule, 'startAt' | 'endAt'> | null {
  const text = label?.trim()
  if (!text) return null
  const matches = [...text.matchAll(SCHEDULE_DATE_PATTERN)]
  if (matches.length === 0) return null
  const toIso = (match: RegExpMatchArray, timeOverride?: [string, string]) => {
    const [, year, month, day] = match
    const hour = timeOverride?.[0] ?? match[4]
    const minute = timeOverride?.[1] ?? match[5]
    const time = hour != null && minute != null ? `${pad2(Number(hour))}:${minute}` : '00:00'
    return `${year}-${pad2(Number(month))}-${pad2(Number(day))}T${time}:00`
  }
  const first = matches[0]!
  const last = matches[matches.length - 1]!
  const rest = text.slice((last.index ?? 0) + last[0].length)
  const trailingEnd = rest.match(/^\s*~\s*(\d{1,2}):(\d{2})/)
  return {
    startAt: toIso(first),
    endAt: toIso(last, trailingEnd ? [trailingEnd[1]!, trailingEnd[2]!] : undefined),
  }
}

/** CMS 숫자 id만 Portal `programId`로 쓴다. 등록 중(로컬 id)은 0 */
export function toPortalProgramId(id: string | number | null | undefined): number {
  const numeric = Number(id)
  return Number.isInteger(numeric) && numeric > 0 ? numeric : 0
}

/** `A, B` 표시명 → `sponsorNames[]` */
export function toPortalSponsorNames(value: string | null | undefined): string[] | undefined {
  const names = (value ?? '')
    .split(',')
    .map(name => name.trim())
    .filter(name => name && name !== '-')
  return names.length > 0 ? names : undefined
}
