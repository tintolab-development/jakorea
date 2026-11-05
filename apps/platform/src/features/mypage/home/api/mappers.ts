import type { ProgramApplicationType } from '@/features/mypage/education/applications/api/types'
import { toSeoulDateOnly } from '@/shared/lib/format-display-date'
import {
  formatPortalCalendarTimeRange,
  mapPortalCalendarEventTitle,
  resolvePortalCalendarDateKey,
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

function readProgramApplicationType(value: string | undefined): ProgramApplicationType | undefined {
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

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

export function mapPortalScheduleItem(item: PortalScheduleItem): MypageScheduleEvent | null {
  const type = mapPortalScheduleEventType(item)
  if (type == null) return null

  const startDate = resolvePortalCalendarDateKey(item)
  const eventId = resolvePortalCalendarEventId(type, item)
  if (!startDate || eventId == null) return null

  const endDate = toSeoulDateOnly(item.endAt) ?? startDate
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

  return {
    id: eventId,
    programName: item.programTitle?.trim() || '프로그램',
    title: mapPortalCalendarEventTitle(item, type),
    time,
    type,
    startDate,
    endDate,
    ...(item.programId != null ? { programId: String(item.programId) } : {}),
    ...(item.applicationId != null ? { applicationId: String(item.applicationId) } : {}),
    ...(applicationType ? { applicationType } : {}),
  }
}

export function mapPortalScheduleItems(items: PortalScheduleItem[] | undefined): MypageScheduleEvent[] {
  return (items ?? []).flatMap(item => {
    const mapped = mapPortalScheduleItem(item)
    return mapped ? [mapped] : []
  })
}

/** BE Instant/OffsetDateTime — offset 필수. 로컬 월 경계를 그대로 보낸다. */
function formatOffset(date: Date): string {
  const offsetMin = -date.getTimezoneOffset()
  const sign = offsetMin >= 0 ? '+' : '-'
  const abs = Math.abs(offsetMin)
  return `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`
}

export function portalCalendarRange(month: Date): { from: string; to: string } {
  const start = new Date(month.getFullYear(), month.getMonth(), 1, 0, 0, 0)
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59)
  const format = (date: Date) =>
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}${formatOffset(date)}`
  return { from: format(start), to: format(end) }
}
