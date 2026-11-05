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
  'program',
  'lecture_report_deadline',
] as const satisfies readonly MypageScheduleEventType[]

const CALENDAR_EVENT_TYPE_SET = new Set<string>(MYPAGE_CALENDAR_EVENT_TYPES)

export const CALENDAR_EVENT_FALLBACK_TITLE: Record<MypageScheduleEventType, string> = {
  assignment: '과제 제출',
  satisfaction: '만족도조사',
  survey: '설문조사',
  receipt: '영수증 신청 마감',
  education: '교육 일정',
  program: '프로그램 일정',
  lecture_report_deadline: '강의보고서 제출 마감',
}

export type ResolvedCalendarEventType =
  | { kind: 'mapped'; type: MypageScheduleEventType }
  | { kind: 'legacy_education' }
  | { kind: 'unsupported' }

function compactEventType(value: string): string {
  return value.trim().toLowerCase().replace(/[-\s]/g, '_')
}

export function resolvePortalCalendarEventType(
  eventType: string | undefined,
): ResolvedCalendarEventType {
  const raw = eventType?.trim()
  if (!raw) return { kind: 'legacy_education' }
  if (isPortalLectureReportDeadlineEventType(raw)) {
    return { kind: 'mapped', type: 'lecture_report_deadline' }
  }
  const normalized = compactEventType(raw)
  if (CALENDAR_EVENT_TYPE_SET.has(normalized)) {
    return { kind: 'mapped', type: normalized as MypageScheduleEventType }
  }
  return { kind: 'unsupported' }
}

function formatClock(value: string | undefined): string | null {
  const parts = toSeoulDisplayParts(value)
  if (!parts?.hasTime) return null
  return formatDisplayClock(parts.hour, parts.minute)
}

export function formatPortalCalendarTimeRange(item: {
  allDay?: boolean
  startAt?: string
  endAt?: string
}): { time: string; allDayTimeConflict: boolean } {
  const start = formatClock(item.startAt)
  const end = formatClock(item.endAt)
  const hasClock = start != null || end != null
  const allDayTimeConflict = item.allDay === true && hasClock

  if (start && end) {
    return { time: start === end ? start : `${start}~${end}`, allDayTimeConflict }
  }
  if (start || end) {
    return { time: start ?? end ?? '', allDayTimeConflict }
  }
  if (item.allDay === true) {
    return { time: '종일', allDayTimeConflict: false }
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

export function resolvePortalCalendarEventId(
  type: MypageScheduleEventType,
  item: PortalScheduleItem,
): string | null {
  const explicit = readEventIdentityToken(item.eventId) ?? readEventIdentityToken(item.id)
  if (explicit) return `${type}:${explicit}`

  const scheduleId = readEventIdentityToken(item.scheduleId)
  if (scheduleId) return `${type}:${scheduleId}`

  const applicationId = readEventIdentityToken(item.applicationId)
  const programId = readEventIdentityToken(item.programId)
  const dateKey = toSeoulDateOnly(item.startAt) ?? toSeoulDateOnly(item.endAt)
  if (applicationId && dateKey) return `${type}:application:${applicationId}:${dateKey}`
  if (programId && dateKey) return `${type}:program:${programId}:${dateKey}`
  return null
}

export function mapPortalCalendarEventTitle(
  item: PortalScheduleItem,
  type: MypageScheduleEventType,
): string {
  if (type === 'lecture_report_deadline') {
    return lectureReportDeadlineCalendarTitle(item.scheduleName)
  }
  const named = toDisplayEducationScheduleName(item.scheduleName)
  if (named) return named
  if (type === 'education') {
    return item.locationName?.trim() || CALENDAR_EVENT_FALLBACK_TITLE.education
  }
  if (type === 'program') {
    return item.locationName?.trim() || CALENDAR_EVENT_FALLBACK_TITLE.program
  }
  return CALENDAR_EVENT_FALLBACK_TITLE[type]
}

export function resolvePortalCalendarDateKey(item: PortalScheduleItem): string | null {
  return toSeoulDateOnly(item.startAt) ?? toSeoulDateOnly(item.endAt) ?? null
}
