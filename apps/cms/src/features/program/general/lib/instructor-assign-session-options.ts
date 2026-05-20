/**
 * 참여 기관 회차 일정 → 강사 추가 배정 모달「교육 배정일 선택」태그 옵션
 */

import type { ParticipatingSchoolSession } from '@/data/mock/participating-schools'

export interface InstructorAssignSessionOption {
  id: string
  dateLabel: string
  durationLabel: string
  timeRangeLabel: string
  /** 진행 완료 등 선택 불가(회색 태그) */
  disabled?: boolean
}

/** 추가 배정 모달 시안용 고정 목데이터(2열 4개 태그) */
export const MOCK_INSTRUCTOR_ASSIGN_SESSION_OPTIONS: InstructorAssignSessionOption[] = [
  {
    id: 'mock-assign-session-1',
    dateLabel: '26. 01. 09. 금',
    durationLabel: '1시간',
    timeRangeLabel: '09:20 ~ 10:10',
  },
  {
    id: 'mock-assign-session-2',
    dateLabel: '26. 01. 16. 금',
    durationLabel: '2시간',
    timeRangeLabel: '09:20 ~ 11:10',
  },
  {
    id: 'mock-assign-session-3',
    dateLabel: '26. 01. 23. 금',
    durationLabel: '1시간',
    timeRangeLabel: '09:20 ~ 10:10',
    disabled: true,
  },
  {
    id: 'mock-assign-session-4',
    dateLabel: '26. 01. 30. 금',
    durationLabel: '3시간',
    timeRangeLabel: '09:20 ~ 12:10',
  },
]

function formatShortDateWithWeekday(dateRaw: string, dayOfWeek: string): string {
  const cleaned = dateRaw.trim()
  const parts = cleaned.split(/[.\\/]/).filter(p => p.length > 0)
  if (parts.length >= 3) {
    const y = parseInt(parts[0]!, 10)
    const yy = Number.isFinite(y) ? String(y).slice(-2) : parts[0]!.slice(-2)
    const mm = parts[1]!.padStart(2, '0')
    const dd = parts[2]!.padStart(2, '0')
    return `${yy}. ${mm}. ${dd}. ${dayOfWeek}`
  }
  return `${cleaned} ${dayOfWeek}`
}

function normalizeDurationLabel(raw: string): string {
  const t = raw.trim()
  if (t.includes('시간')) return t
  const n = parseInt(t, 10)
  return Number.isFinite(n) ? `${n}시간` : t || '1시간'
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

/** 참여 학교 mock 회차 → 배정일 태그 (완료 회차는 비활성) */
export function mapParticipatingSessionsToInstructorAssignOptions(
  sessions: ParticipatingSchoolSession[] | undefined | null
): InstructorAssignSessionOption[] {
  if (!sessions?.length) return []
  return sessions.map(s => ({
    id: `session-${s.round}-${s.date}-${s.timeRange}`,
    dateLabel: formatShortDateWithWeekday(s.date, s.dayOfWeek),
    durationLabel: normalizeDurationLabel(s.duration),
    timeRangeLabel: normalizeTimeRangeDisplay(s.timeRange),
    disabled: s.status === 'completed',
  }))
}
