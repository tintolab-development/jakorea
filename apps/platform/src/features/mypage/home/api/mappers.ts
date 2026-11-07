import type { ProgramApplicationType } from '@/features/mypage/education/applications/api/types'
import {
  formatPortalCalendarTimeRange,
  mapPortalCalendarEventTitle,
  resolvePortalCalendarDateSpan,
  resolvePortalCalendarEventId,
  resolvePortalCalendarEventType,
} from '../lib/calendar-event-map'
import type { MypageScheduleEvent, MypageScheduleEventType } from '../model/schedule-types'
import type { PortalScheduleItem } from './client'

export { mapPortalDashboardStats } from './dashboard-stats'

const APPLICATION_TYPE_SET = new Set<ProgramApplicationType>([
  'INDIVIDUAL',
  'ORGANIZATION',
  'INSTRUCTOR',
  'VOLUNTEER',
])

function readProgramApplicationType(value: string | undefined | null): ProgramApplicationType | undefined {
  const normalized = value?.trim().toUpperCase()
  if (normalized && APPLICATION_TYPE_SET.has(normalized as ProgramApplicationType)) {
    return normalized as ProgramApplicationType
  }
  return undefined
}

function mapPortalScheduleEventType(item: PortalScheduleItem): MypageScheduleEventType | null {
  const resolved = resolvePortalCalendarEventType(item.eventType)
  if (resolved.kind === 'unsupported') return null
  if (resolved.kind === 'legacy_education') return 'education'
  return resolved.type
}

function readOptionalId(value: unknown): string | undefined {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) {
    return String(value)
  }
  if (typeof value === 'string' && value.trim()) {
    return value.trim()
  }
  return undefined
}

export function mapPortalScheduleItem(item: PortalScheduleItem): MypageScheduleEvent | null {
  const type = mapPortalScheduleEventType(item)
  if (type == null) return null

  const span = resolvePortalCalendarDateSpan(item, type)
  const eventId = resolvePortalCalendarEventId(type, item)
  if (!span || eventId == null) return null

  const { time, allDayTimeConflict } = formatPortalCalendarTimeRange(item)
  if (allDayTimeConflict && import.meta.env.DEV) {
    console.warn('portal calendar allDay=true but startAt/endAt include a clock', {
      eventId,
      eventType: item.eventType,
      startAt: item.startAt,
      endAt: item.endAt,
    })
  }

  const applicationType =
    type === 'lecture_report_deadline'
      ? 'INSTRUCTOR'
      : (readProgramApplicationType(item.applicationType) ??
        readProgramApplicationType(item.participationRole))

  const scheduleId = readOptionalId(item.scheduleId)
  const formBindingId = readOptionalId(item.formBindingId)
  const assignmentId = readOptionalId(item.assignmentId)

  return {
    id: eventId,
    programName: item.programTitle?.trim() || '프로그램',
    title: mapPortalCalendarEventTitle(item, type),
    time,
    type,
    startDate: span.startDate,
    endDate: span.endDate,
    ...(item.allDay != null ? { allDay: item.allDay } : {}),
    ...(item.programId != null ? { programId: String(item.programId) } : {}),
    ...(item.applicationId != null ? { applicationId: String(item.applicationId) } : {}),
    ...(applicationType ? { applicationType } : {}),
    ...(scheduleId ? { scheduleId } : {}),
    ...(formBindingId ? { formBindingId } : {}),
    ...(assignmentId ? { assignmentId } : {}),
    ...(item.reportStatus?.trim() ? { reportStatus: item.reportStatus.trim() } : {}),
    ...(typeof item.canSubmit === 'boolean' ? { canSubmit: item.canSubmit } : {}),
    ...(item.status?.trim() ? { status: item.status.trim() } : {}),
  }
}

export function mapPortalScheduleItems(items: PortalScheduleItem[] | undefined): MypageScheduleEvent[] {
  return (items ?? []).flatMap(item => {
    const mapped = mapPortalScheduleItem(item)
    return mapped ? [mapped] : []
  })
}

/** Asia/Seoul 달력월 → UTC Instant. 로컬 midnight/23:59를 보내지 않는다. */
export function portalCalendarRange(month: Date): { from: string; to: string } {
  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  const fromUtcMs = Date.UTC(year, monthIndex, 1) - 9 * 60 * 60 * 1000
  const toUtcMs = Date.UTC(year, monthIndex + 1, 1) - 9 * 60 * 60 * 1000
  const formatInstant = (utcMs: number) => new Date(utcMs).toISOString().replace(/\.\d{3}Z$/, 'Z')
  return { from: formatInstant(fromUtcMs), to: formatInstant(toUtcMs) }
}
