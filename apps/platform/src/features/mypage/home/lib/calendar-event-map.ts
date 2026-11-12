import { toDisplayEducationScheduleName } from '@/shared/lib/education-schedule-name'
import {
  formatDisplayClock,
  toSeoulDateOnly,
  toSeoulDisplayParts,
} from '@/shared/lib/format-display-date'
import type { MypageScheduleEventType } from '../model/schedule-types'
import type { PortalScheduleItem } from '../api/client'
import {
  isPortalLectureReportDeadlineEventType,
  lectureReportDeadlineCalendarTitle,
} from './lecture-report-calendar'

export const MYPAGE_CALENDAR_EVENT_TYPES = [
  'assignment',
  'satisfaction',
  'survey',
  'receipt',
  'education',
  'lecture_report_deadline',
] as const satisfies readonly MypageScheduleEventType[]

const CALENDAR_EVENT_TYPE_SET = new Set<string>(MYPAGE_CALENDAR_EVENT_TYPES)

const DEADLINE_EVENT_TYPES = new Set<MypageScheduleEventType>([
  'assignment',
  'satisfaction',
  'survey',
  'receipt',
  'lecture_report_deadline',
])

const BE_EVENT_TYPE_TO_UI: Record<string, MypageScheduleEventType> = {
  PROGRAM_SCHEDULE: 'education',
  ASSIGNMENT_DEADLINE: 'assignment',
  SATISFACTION_DEADLINE: 'satisfaction',
  SURVEY_DEADLINE: 'survey',
  EXPENSE_RECEIPT_DEADLINE: 'receipt',
  LECTURE_REPORT_DEADLINE: 'lecture_report_deadline',
  EXPENSE_RECEIPT: 'receipt',
}

const UI_EVENT_ID_PREFIX: Record<MypageScheduleEventType, string> = {
  education: 'PROGRAM_SCHEDULE',
  assignment: 'ASSIGNMENT_DEADLINE',
  satisfaction: 'SATISFACTION_DEADLINE',
  survey: 'SURVEY_DEADLINE',
  receipt: 'EXPENSE_RECEIPT_DEADLINE',
  lecture_report_deadline: 'LECTURE_REPORT_DEADLINE',
}

export const CALENDAR_EVENT_FALLBACK_TITLE: Record<MypageScheduleEventType, string> = {
  assignment: '과제 제출',
  satisfaction: '만족도조사',
  survey: '설문조사',
  receipt: '영수증 신청 마감',
  education: '프로그램 일정',
  lecture_report_deadline: '강의보고서 제출 마감',
}

export type PortalCalendarTimeAvailability =
  | 'TIME_PRESENT'
  | 'DATE_ONLY'
  | 'SOURCE_TIME_NOT_AVAILABLE'

export type ResolvedCalendarEventType =
  | { kind: 'mapped'; type: MypageScheduleEventType }
  | { kind: 'legacy_education' }
  | { kind: 'unsupported' }

const ISO_DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/

function compactEventType(value: string): string {
  return value.trim().toLowerCase().replace(/[-\s]/g, '_')
}

function normalizeBeEventTypeKey(value: string): string {
  return value.trim().toUpperCase().replace(/[-\s]/g, '_')
}

export function readPortalCalendarTimeAvailability(
  value: string | null | undefined,
): PortalCalendarTimeAvailability | undefined {
  const key = value?.trim().toUpperCase().replace(/[-\s]/g, '_')
  if (key === 'TIME_PRESENT' || key === 'DATE_ONLY' || key === 'SOURCE_TIME_NOT_AVAILABLE') {
    return key
  }
  return undefined
}

export function resolvePortalCalendarEventType(
  eventType: string | null | undefined,
): ResolvedCalendarEventType {
  const raw = eventType?.trim()
  if (!raw) return { kind: 'legacy_education' }
  if (isPortalLectureReportDeadlineEventType(raw)) {
    return { kind: 'mapped', type: 'lecture_report_deadline' }
  }

  const beKey = normalizeBeEventTypeKey(raw)
  const fromBe = BE_EVENT_TYPE_TO_UI[beKey]
  if (fromBe) return { kind: 'mapped', type: fromBe }

  const normalized = compactEventType(raw)
  if (CALENDAR_EVENT_TYPE_SET.has(normalized)) {
    return { kind: 'mapped', type: normalized as MypageScheduleEventType }
  }

  if (normalized.endsWith('_deadline')) {
    const base = normalized.slice(0, -'_deadline'.length)
    if (base === 'expense_receipt') return { kind: 'mapped', type: 'receipt' }
    if (CALENDAR_EVENT_TYPE_SET.has(base)) {
      return { kind: 'mapped', type: base as MypageScheduleEventType }
    }
  }

  return { kind: 'unsupported' }
}

function formatClock(value: string | undefined): string | null {
  const parts = toSeoulDisplayParts(value)
  if (!parts?.hasTime) return null
  return formatDisplayClock(parts.hour, parts.minute)
}

export function formatPortalCalendarTimeRange(item: {
  allDay?: boolean | null
  startAt?: string | null
  endAt?: string | null
  timeAvailability?: string | null
}): { time: string; allDayTimeConflict: boolean } {
  const availability = readPortalCalendarTimeAvailability(item.timeAvailability ?? undefined)
  if (availability === 'SOURCE_TIME_NOT_AVAILABLE') {
    return { time: '', allDayTimeConflict: false }
  }

  const start = formatClock(item.startAt ?? undefined)
  const end = formatClock(item.endAt ?? undefined)
  const hasClock = start != null || end != null
  const clockLabel =
    start && end ? (start === end ? start : `${start}~${end}`) : (start ?? end ?? '')
  const allDayTimeConflict = item.allDay === true && hasClock

  if (availability === 'TIME_PRESENT') {
    return { time: clockLabel, allDayTimeConflict }
  }
  if (availability === 'DATE_ONLY' || (item.allDay === true && !hasClock)) {
    return { time: '종일', allDayTimeConflict: false }
  }
  if (hasClock) {
    return { time: clockLabel, allDayTimeConflict }
  }
  return { time: '', allDayTimeConflict: false }
}

function readEventIdentityToken(value: unknown): string | null {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) {
    return String(value)
  }
  if (typeof value === 'string' && value.trim()) {
    return value.trim()
  }
  return null
}

function reconstructPortalCalendarEventId(
  type: MypageScheduleEventType,
  item: PortalScheduleItem,
): string | null {
  const scheduleId = readEventIdentityToken(item.scheduleId)
  const applicationId = readEventIdentityToken(item.applicationId)
  const applicationType = item.applicationType?.trim().toUpperCase()
  const formBindingId = readEventIdentityToken(item.formBindingId)
  const assignmentId = readEventIdentityToken(item.assignmentId)
  const prefix = UI_EVENT_ID_PREFIX[type]

  if (type === 'education' && scheduleId) return `${prefix}:${scheduleId}`
  if (type === 'receipt' && applicationType && applicationId) {
    return `${prefix}:${applicationType}:${applicationId}`
  }
  if (
    (type === 'assignment' || type === 'satisfaction' || type === 'survey') &&
    formBindingId &&
    applicationType &&
    applicationId
  ) {
    return `${prefix}:${formBindingId}:${applicationType}:${applicationId}`
  }
  if (type === 'lecture_report_deadline' && (assignmentId || scheduleId)) {
    return `${prefix}:${assignmentId ?? scheduleId}`
  }
  return null
}

export function resolvePortalCalendarEventId(
  type: MypageScheduleEventType,
  item: PortalScheduleItem,
): string | null {
  const explicit = readEventIdentityToken(item.eventId)
  if (explicit?.includes(':')) return explicit

  const reconstructed = reconstructPortalCalendarEventId(type, item)
  if (reconstructed) return reconstructed

  if (explicit) return `${UI_EVENT_ID_PREFIX[type]}:${explicit}`

  const legacyId = readEventIdentityToken(item.id)
  if (legacyId?.includes(':')) return legacyId
  if (legacyId) return `${UI_EVENT_ID_PREFIX[type]}:${legacyId}`
  return null
}

export function mapPortalCalendarEventTitle(
  item: PortalScheduleItem,
  type: MypageScheduleEventType,
): string {
  const titled = item.title?.trim()
  if (titled) return titled
  if (type === 'lecture_report_deadline') {
    return lectureReportDeadlineCalendarTitle(item.scheduleName ?? undefined)
  }
  const named = toDisplayEducationScheduleName(item.scheduleName ?? undefined)
  if (named) return named
  if (item.programTitle?.trim() && type === 'education') {
    return item.programTitle.trim()
  }
  if (type === 'education') {
    return item.locationName?.trim() || CALENDAR_EVENT_FALLBACK_TITLE.education
  }
  return CALENDAR_EVENT_FALLBACK_TITLE[type]
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

function readDeadlineDate(item: PortalScheduleItem): string | null {
  const raw = item.deadlineDate?.trim()
  if (raw && ISO_DATE_ONLY_RE.test(raw)) return raw
  return toSeoulDateOnly(item.deadlineAt) ?? toSeoulDateOnly(item.submitDueAt) ?? null
}

function shiftIsoDateOnly(dateKey: string, days: number): string {
  const match = ISO_DATE_ONLY_RE.exec(dateKey)
  if (!match) return dateKey
  const utc = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]) + days)
  const shifted = new Date(utc)
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`
}

function exclusiveAllDayEndDate(endAt: string | undefined): string | undefined {
  const date = toSeoulDateOnly(endAt)
  if (!date) return undefined
  const parts = toSeoulDisplayParts(endAt)
  if (parts && parts.hour === 0 && parts.minute === 0 && parts.second === 0) {
    return shiftIsoDateOnly(date, -1)
  }
  return date
}

export function resolvePortalCalendarDateSpan(
  item: PortalScheduleItem,
  type: MypageScheduleEventType,
): { startDate: string; endDate: string } | null {
  const deadlineDate = readDeadlineDate(item)
  if (DEADLINE_EVENT_TYPES.has(type) && deadlineDate) {
    return { startDate: deadlineDate, endDate: deadlineDate }
  }

  const availability = readPortalCalendarTimeAvailability(item.timeAvailability)
  const startDate =
    toSeoulDateOnly(item.startAt) ?? deadlineDate ?? toSeoulDateOnly(item.endAt) ?? null
  if (!startDate) return null

  const useExclusiveEnd =
    availability === 'DATE_ONLY' ||
    (availability !== 'TIME_PRESENT' && item.allDay === true)

  const endDate = useExclusiveEnd
    ? (exclusiveAllDayEndDate(item.endAt ?? undefined) ?? startDate)
    : (toSeoulDateOnly(item.endAt) ?? startDate)

  return { startDate, endDate: endDate < startDate ? startDate : endDate }
}

export function resolvePortalCalendarDateKey(item: PortalScheduleItem): string | null {
  return (
    readDeadlineDate(item) ?? toSeoulDateOnly(item.startAt) ?? toSeoulDateOnly(item.endAt) ?? null
  )
}
