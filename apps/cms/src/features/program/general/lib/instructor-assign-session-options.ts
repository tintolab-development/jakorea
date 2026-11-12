/**
 * 참여 기관 회차 일정 → 강사 추가 배정 모달「교육 배정일 선택」태그 옵션
 */

import {
  formatCmsScheduleDisplayLabel,
  formatOrganizationScheduleRangeLabel,
} from '@/features/program/general/lib/organization-preferred-schedule-label'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import { resolveAssignableSchedulePayloadFromSession } from '@/features/program/general/lib/organization-instructor-assignable-schedule'
import {
  formatEducationScheduleUnitLabel,
  parseConfirmedCurriculumSessionCount,
} from '@/shared/lib/education-schedule-name'

export interface InstructorAssignSessionOption {
  id: string
  /** 날짜 라벨 (예: 26년 4월 20일(월)) — dateLabel 미지정 시 scheduleLabel 전체 표시 */
  dateLabel?: string
  /** 진행 시간 (예: 09:30 ~ 12:20) */
  timeLabel?: string
  /** 예: 26년 4월 20일(월) 09:30 ~ 12:20 */
  scheduleLabel: string
  /** 예: 1회차 (2차시) */
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

function splitRangeDateAndTime(range: string): { dateLabel: string; timeLabel: string } {
  const match = range.match(/^(\d{4}\.\d{2}\.\d{2}\([^)]+\))\s+(.+)$/u)
  if (match) return { dateLabel: match[1]!, timeLabel: match[2]! }
  return { dateLabel: range, timeLabel: '' }
}

export function resolveAssignmentRoundSessionLabel(
  session: Pick<
    ParticipatingSchoolSession,
    | 'round'
    | 'sessionNo'
    | 'classNum'
    | 'duration'
    | 'scheduleLabel'
    | 'scheduleRole'
    | 'educationSlotKey'
    | 'curriculumSessionCount'
  >
): string {
  return formatEducationScheduleUnitLabel({
    sessionNo: session.sessionNo ?? session.round,
    scheduleRole: session.scheduleRole,
    educationSlotKey: session.educationSlotKey,
    curriculumSessionCount:
      session.curriculumSessionCount ??
      parseConfirmedCurriculumSessionCount(session.classNum) ??
      parseConfirmedCurriculumSessionCount(session.duration) ??
      parseConfirmedCurriculumSessionCount(session.scheduleLabel),
  })
}

/** 참여 학교 회차 일정 → 배정 모달 날짜·시간 라벨 */
export function resolveInstructorAssignSessionDisplayLabels(
  session: ParticipatingSchoolSession
): { dateLabel: string; timeLabel: string; scheduleLabel: string } {
  const fromInstant = formatOrganizationScheduleRangeLabel(session.startAt, session.endAt)
  if (fromInstant && /\d{1,2}:\d{2}/.test(fromInstant)) {
    const split = splitRangeDateAndTime(fromInstant)
    return {
      dateLabel: split.dateLabel,
      timeLabel: split.timeLabel,
      scheduleLabel: fromInstant,
    }
  }
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

/** 참여 학교 회차 → 배정일 태그 (완료 회차·isSessionDisabled(예: 강사 정원 도달) 회차는 비활성) */
export function mapParticipatingSessionsToInstructorAssignOptions(
  sessions: ParticipatingSchoolSession[] | undefined | null,
  options?: {
    isSessionDisabled?: (session: ParticipatingSchoolSession) => boolean
    /** 칩 순위 라벨. 기본 `N회차`({@link resolveAssignmentRoundSessionLabel}) — 1사1교는 회차 대신 지망 */
    resolveSessionRoundLabel?: (session: ParticipatingSchoolSession) => string
  }
): InstructorAssignSessionOption[] {
  if (!sessions?.length) return []
  return sessions.map(s => {
    const { dateLabel, timeLabel, scheduleLabel } = resolveInstructorAssignSessionDisplayLabels(s)
    return {
      id: `session-${s.round}-${s.date}-${s.timeRange}`,
      dateLabel: dateLabel || undefined,
      timeLabel,
      scheduleLabel,
      sessionRoundLabel: (options?.resolveSessionRoundLabel ?? resolveAssignmentRoundSessionLabel)(s),
      capacityLabel: '0명',
      disabled:
        s.status === 'completed' ||
        resolveAssignableSchedulePayloadFromSession(s) == null ||
        options?.isSessionDisabled?.(s) === true,
    }
  })
}
