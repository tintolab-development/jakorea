import type { MypageProgramStats } from '../../model/types'
import type { MypageScheduleEvent } from '../model/schedule-types'
import type { PortalApplicationSummary, PortalScheduleItem } from './client'
import { toDisplayEducationScheduleName } from '@/shared/lib/education-schedule-name'

const EMPTY_STATS: MypageProgramStats = {
  applied: 0,
  inProgress: 0,
  completed: 0,
}

function count(value: number | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

/** 목록 탭과 같은 묶음. 신청=제출·승인, 종료=완료·포기·반려·취소. */
export function mapPortalDashboardStats(
  summary: PortalApplicationSummary | undefined,
): MypageProgramStats {
  if (!summary) return EMPTY_STATS
  return {
    applied: count(summary.submitted) + count(summary.approved),
    inProgress: count(summary.inProgress),
    completed:
      count(summary.completed) +
      count(summary.giveUp) +
      count(summary.rejected) +
      count(summary.cancelled),
  }
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
  return {
    id: String(item.scheduleId),
    programName: item.programTitle?.trim() || '프로그램',
    title: toDisplayEducationScheduleName(item.scheduleName) || item.locationName?.trim() || '일정',
    time: formatTimeRange(item),
    type: 'education',
    startDate,
    endDate,
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
