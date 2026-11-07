import type { ApplicantPreferredScheduleBlock } from '@/features/program/shared/model/applicant-institution'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import type { GeneralEducationScheduleShape } from '@/features/program/general/lib/participating-school-session-display'

/** TT 참여기관 상세 교육 진행 일정 — 일시 | 1차시. 지망은 행 라벨만. */
export const TRAINED_TEACHER_EDUCATION_PROGRESS_SHAPE: GeneralEducationScheduleShape = {
  educationStructure: 'curriculum',
  sessionRound: 'multi',
  educationScheduleMode: 'date',
}

export type TrainedTeacherEducationProgressRow = {
  rowLabel: string
  session: ParticipatingSchoolSession
  /** educationSchedules[].scheduleId. 출석 조회/저장은 이 값을 유지한다. */
  attendanceScheduleIds: number[]
}

export type TrainedTeacherEducationProgressBadge = {
  label: string
  statusClass: string
}

function preferredScheduleId(block: ApplicantPreferredScheduleBlock): number | null {
  return typeof block.scheduleId === 'number' &&
    Number.isSafeInteger(block.scheduleId) &&
    block.scheduleId > 0
    ? Math.trunc(block.scheduleId)
    : null
}

function isMatchedPreferredStatus(scheduleStatus: string | null | undefined): boolean {
  return (scheduleStatus ?? '').trim().toUpperCase() === 'MATCHED'
}

function matchedPreferredRankByScheduleId(
  preferredBlocks: readonly ApplicantPreferredScheduleBlock[] | null | undefined
): Map<number, number> {
  const matched = new Map<number, number>()
  for (const block of preferredBlocks ?? []) {
    const scheduleId = preferredScheduleId(block)
    if (scheduleId == null || block.preferenceRank <= 0) continue
    if (!isMatchedPreferredStatus(block.scheduleStatus)) continue
    if (matched.has(scheduleId)) continue
    matched.set(scheduleId, block.preferenceRank)
  }
  return matched
}

function sessionScheduleId(session: ParticipatingSchoolSession): number | null {
  return typeof session.resolvedScheduleId === 'number' &&
    Number.isSafeInteger(session.resolvedScheduleId) &&
    session.resolvedScheduleId > 0
    ? session.resolvedScheduleId
    : null
}

function splitTimeRange(timeRange: string): { start: string; end: string } {
  const [startRaw = '', endRaw = ''] = timeRange.split('~')
  const start = startRaw.trim()
  const end = endRaw.trim() || start
  return { start, end }
}

/**
 * 시안 일시: `2026.04.20(월) 09:30 ~ 12:20` (점 뒤 공백 없음)
 */
export function formatTrainedTeacherEducationProgressDateTime(
  session: Pick<ParticipatingSchoolSession, 'date' | 'dayOfWeek' | 'timeRange'>
): string {
  const date = (session.date ?? '').trim().replace(/\s+/g, '')
  const day = (session.dayOfWeek ?? '').trim()
  const datePart = date && day ? `${date}(${day})` : date
  const { start, end } = splitTimeRange(session.timeRange ?? '')
  if (datePart && start && end) return `${datePart} ${start} ~ ${end}`
  if (datePart && start) return `${datePart} ${start}`
  return datePart
}

/**
 * educationSchedules[].scheduleStatus 만 뱃지로 쓴다.
 * COMPLETED → 진행 완료(#017EAF), SCHEDULED → 진행 대기(#1E8C29),
 * IN_PROGRESS → 진행 중. UNSCHEDULED · null · MATCHED 는 뱃지 없음.
 */
export function resolveTrainedTeacherEducationProgressBadge(
  scheduleStatus: string | null | undefined
): TrainedTeacherEducationProgressBadge | null {
  const normalized = (scheduleStatus ?? '').trim().toUpperCase()
  if (normalized === 'COMPLETED') {
    return {
      label: '진행 완료',
      statusClass: 'participating-institution-application-info__session-status--completed',
    }
  }
  if (normalized === 'SCHEDULED') {
    return {
      label: '진행 대기',
      statusClass: 'participating-institution-application-info__session-status--pending',
    }
  }
  if (normalized === 'IN_PROGRESS') {
    return {
      label: '진행 중',
      statusClass: 'participating-institution-application-info__session-status--in_progress',
    }
  }
  return null
}

/**
 * 상세 GET educationSchedules[] 한 건 = 운영 일정 1행. 서버 배열 순서를 유지한다.
 * preferredScheduleBlocks로 행을 채우거나 MATCHED 지망을 자르지 않는다.
 * 지망 라벨은 MATCHED preferredScheduleBlocks.scheduleId → preferenceRank 룩업만.
 */
export function buildTrainedTeacherEducationProgressRows(
  sessions: readonly ParticipatingSchoolSession[] | null | undefined,
  preferredBlocks: readonly ApplicantPreferredScheduleBlock[] | null | undefined = []
): TrainedTeacherEducationProgressRow[] {
  const source = sessions ?? []
  if (source.length === 0) return []

  const matchedRank = matchedPreferredRankByScheduleId(preferredBlocks)

  return source.map(session => {
    const scheduleId = sessionScheduleId(session)
    const preferenceRank = scheduleId != null ? matchedRank.get(scheduleId) : undefined
    const { start, end } = splitTimeRange(session.timeRange ?? '')
    const status = (session.deliveryScheduleStatus ?? '').trim().toUpperCase()

    return {
      rowLabel: preferenceRank != null ? `${preferenceRank}지망` : '',
      attendanceScheduleIds: scheduleId != null ? [scheduleId] : [],
      session: {
        ...session,
        classNum: '',
        duration: '1차시',
        timeRange: start && end ? `${start}~${end}` : session.timeRange,
        ...(status ? { deliveryScheduleStatus: status } : { deliveryScheduleStatus: undefined }),
        status: undefined,
      },
    }
  })
}
