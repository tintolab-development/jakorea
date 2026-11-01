import type { ProgramApplicationType } from '@/features/mypage/education/applications/api/types'
import { toDisplayEducationScheduleName } from '@/shared/lib/education-schedule-name'
import type { MypageScheduleEvent, MypageScheduleEventType } from '../model/schedule-types'
import type { PortalScheduleItem } from './client'

export { mapPortalDashboardStats } from './dashboard-stats'

const CALENDAR_EVENT_TYPES = new Set<MypageScheduleEventType>([
  'assignment',
  'satisfaction',
  'survey',
  'receipt',
  'education',
  'program',
])

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

function mapPortalScheduleEventType(item: PortalScheduleItem): MypageScheduleEventType {
  const normalized = item.eventType?.trim().toLowerCase()
  if (normalized && CALENDAR_EVENT_TYPES.has(normalized as MypageScheduleEventType)) {
    return normalized as MypageScheduleEventType
  }
  return 'education'
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

function toDateKey(value: string | undefined): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function formatClock(value: string | undefined): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatTimeRange(item: PortalScheduleItem): string {
  if (item.allDay) return '종일'
  const start = formatClock(item.startAt)
  const end = formatClock(item.endAt)
  if (start && end) return `${start}~${end}`
  return start ?? end ?? '종일'
}

export function mapPortalScheduleItem(item: PortalScheduleItem): MypageScheduleEvent | null {
  const startDate = toDateKey(item.startAt)
  if (!startDate || item.scheduleId == null) return null
  const endDate = toDateKey(item.endAt) ?? startDate
  const applicationType =
    readProgramApplicationType(item.applicationType) ??
    readProgramApplicationType(item.participationRole)

  return {
    id: String(item.scheduleId),
    programName: item.programTitle?.trim() || '프로그램',
    title: toDisplayEducationScheduleName(item.scheduleName) || item.locationName?.trim() || '일정',
    time: formatTimeRange(item),
    type: mapPortalScheduleEventType(item),
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
