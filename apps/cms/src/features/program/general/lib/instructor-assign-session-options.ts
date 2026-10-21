/**
 * 참여 기관 회차 일정 → 강사 추가 배정 모달「교육 배정일 선택」태그 옵션
 */

import { formatCmsScheduleDisplayLabel } from '@/features/program/general/lib/organization-preferred-schedule-label'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import { resolveAssignableSchedulePayloadFromSession } from '@/features/program/general/lib/organization-instructor-assignable-schedule'

export interface InstructorAssignSessionOption {
  id: string
  /** 날짜 라벨 (예: 26년 4월 20일(월)) — dateLabel 미지정 시 scheduleLabel 전체 표시 */
  dateLabel?: string
  /** 진행 시간 (예: 09:30 ~ 12:20) */
  timeLabel?: string
  /** 예: 26년 4월 20일(월) 09:30 ~ 12:20 */
  scheduleLabel: string
  /** 예: 2차시 */
  sessionRoundLabel: string
  /** 예: 3명 */
  capacityLabel: string
  dateKey?: string
  slotKey?: string
  /** 진행 완료·강사 일정 불가·타 기관 동일일 배정 등 선택 불가 */
  disabled?: boolean
}

function formatScheduleDateLabel(dateRaw: string, dayOfWeek: string): string {
  const cleaned = dateRaw.trim()
  const formatted = formatCmsScheduleDisplayLabel(cleaned)
  if (formatted !== cleaned || /\([월화수목금토일]\)/u.test(formatted)) return formatted
  return formatCmsScheduleDisplayLabel(`${cleaned}(${dayOfWeek})`)
}

function normalizeTimeRangeDisplay(s: string): string {
  const normalized = s.replace(/\s*~\s*/g, '~')
  const parts = normalized.split('~').map(part => {
    const p = part.trim()
    const m = p.match(/^(\d{1,2}):(\d{2})$/)
    if (m) return `${m[1]!.padStart(2, '0')}:${m[2]}`
    return p
  })
  return parts.join(' ~ ')
}

function isTimeOnlyScheduleLabel(value: string): boolean {
  const compact = value.trim().replace(/\s*~\s*/g, '~')
  const [start, end] = compact.split('~')
  if (!start || !end) return false
  return /^\d{1,2}:\d{2}$/.test(start.trim()) && /^\d{1,2}:\d{2}$/.test(end.trim())
}

/** 참여 학교 회차 일정 → 배정 모달 날짜·시간 라벨 */
export function resolveInstructorAssignSessionDisplayLabels(
  session: ParticipatingSchoolSession
): { dateLabel: string; timeLabel: string; scheduleLabel: string } {
  const timeRange = normalizeTimeRangeDisplay(session.timeRange)
  const dateRaw = session.date.trim()

  if (!dateRaw) {
    return {
      dateLabel: '',
      timeLabel: timeRange,
      scheduleLabel: timeRange,
    }
  }

  if (isTimeOnlyScheduleLabel(dateRaw)) {
    const time = normalizeTimeRangeDisplay(dateRaw)
    return {
      dateLabel: '',
      timeLabel: time,
      scheduleLabel: time,
    }
  }

  const dateLabel = formatScheduleDateLabel(dateRaw, session.dayOfWeek)
  return {
    dateLabel,
    timeLabel: timeRange,
    scheduleLabel: `${dateLabel} ${timeRange}`,
  }
}

/** 참여 학교 회차 → 배정일 태그 (완료 회차는 비활성) */
export function mapParticipatingSessionsToInstructorAssignOptions(
  sessions: ParticipatingSchoolSession[] | undefined | null
): InstructorAssignSessionOption[] {
  if (!sessions?.length) return []
  return sessions.map(s => {
    const { dateLabel, timeLabel, scheduleLabel } = resolveInstructorAssignSessionDisplayLabels(s)
    return {
      id: `session-${s.round}-${s.date}-${s.timeRange}`,
      dateLabel: dateLabel || undefined,
      timeLabel,
      scheduleLabel,
      sessionRoundLabel: `${s.round}차시`,
      capacityLabel: '0명',
      disabled:
        s.status === 'completed' ||
        resolveAssignableSchedulePayloadFromSession(s) == null,
    }
  })
}
