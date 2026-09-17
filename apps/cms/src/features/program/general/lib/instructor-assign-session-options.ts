/**
 * 참여 기관 회차 일정 → 강사 추가 배정 모달「교육 배정일 선택」태그 옵션
 */

import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'

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
  const parts = cleaned.split(/[.\\/]/).filter(p => p.length > 0)
  if (parts.length >= 3) {
    const y = parseInt(parts[0]!, 10)
    const yy = Number.isFinite(y) ? String(y).slice(-2) : parts[0]!.slice(-2)
    const mm = parseInt(parts[1]!, 10)
    const dd = parts[2]!.padStart(2, '0')
    return `${yy}년 ${mm}월 ${dd}일(${dayOfWeek})`
  }
  return `${cleaned}(${dayOfWeek})`
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

/** 참여 학교 회차 → 배정일 태그 (완료 회차는 비활성) */
export function mapParticipatingSessionsToInstructorAssignOptions(
  sessions: ParticipatingSchoolSession[] | undefined | null
): InstructorAssignSessionOption[] {
  if (!sessions?.length) return []
  return sessions.map(s => {
    const dateLabel = formatScheduleDateLabel(s.date, s.dayOfWeek)
    const timeRange = normalizeTimeRangeDisplay(s.timeRange)
    return {
      id: `session-${s.round}-${s.date}-${s.timeRange}`,
      dateLabel,
      timeLabel: timeRange,
      scheduleLabel: `${dateLabel} ${timeRange}`,
      sessionRoundLabel: `${s.round}차시`,
      capacityLabel: '0명',
      disabled: s.status === 'completed',
    }
  })
}
