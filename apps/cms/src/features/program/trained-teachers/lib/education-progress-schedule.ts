import type { ApplicantPreferredScheduleBlock } from '@/features/program/shared/model/applicant-institution'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import type { GeneralEducationScheduleShape } from '@/features/program/general/lib/participating-school-session-display'

/** TT 참여기관 상세 교육 진행 일정 — 일시 | N차시. 지망은 행 라벨만. */
export const TRAINED_TEACHER_EDUCATION_PROGRESS_SHAPE: GeneralEducationScheduleShape = {
  educationStructure: 'curriculum',
  sessionRound: 'multi',
  educationScheduleMode: 'date',
}

export type TrainedTeacherEducationProgressRow = {
  rowLabel: string
  session: ParticipatingSchoolSession
  /** 묶기 전 educationSchedules[].scheduleId. 출석 조회/저장은 이 값을 유지한다. */
  attendanceScheduleIds: number[]
}

export type TrainedTeacherEducationProgressBadge = {
  label: string
  statusClass: string
}

type MatchedPreferredBlock = {
  preferenceRank: number
  dateKey: string
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

function normalizeDateKey(raw: string | null | undefined): string {
  const compact = (raw ?? '').trim().replace(/\s+/g, '')
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(compact)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
  const dotted = /^(\d{4})\.(\d{2})\.(\d{2})/.exec(compact)
  if (dotted) return `${dotted[1]}-${dotted[2]}-${dotted[3]}`
  return compact
}

function matchedPreferredByScheduleId(
  preferredBlocks: readonly ApplicantPreferredScheduleBlock[] | null | undefined
): Map<number, MatchedPreferredBlock> {
  const matched = new Map<number, MatchedPreferredBlock>()
  for (const block of preferredBlocks ?? []) {
    const scheduleId = preferredScheduleId(block)
    if (scheduleId == null || block.preferenceRank <= 0) continue
    if (!isMatchedPreferredStatus(block.scheduleStatus)) continue
    if (matched.has(scheduleId)) continue
    matched.set(scheduleId, {
      preferenceRank: block.preferenceRank,
      dateKey: normalizeDateKey(block.date),
    })
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

function groupKey(
  session: ParticipatingSchoolSession,
  matched: Map<number, MatchedPreferredBlock>,
  index: number
): string {
  const scheduleId = sessionScheduleId(session)
  const block = scheduleId != null ? matched.get(scheduleId) : undefined
  if (block) return `rank:${block.preferenceRank}|date:${block.dateKey}`
  if (scheduleId != null) return `id:${scheduleId}`
  return `row:${index}`
}

function splitTimeRange(timeRange: string): { start: string; end: string } {
  const [startRaw = '', endRaw = ''] = timeRange.split('~')
  const start = startRaw.trim()
  const end = endRaw.trim() || start
  return { start, end }
}

function sortSessions(group: readonly ParticipatingSchoolSession[]): ParticipatingSchoolSession[] {
  return [...group].sort((a, b) => {
    const byStart = (a.startAt ?? '').localeCompare(b.startAt ?? '')
    if (byStart !== 0) return byStart
    return (a.timeRange ?? '').localeCompare(b.timeRange ?? '')
  })
}

function pickGroupScheduleStatus(
  group: readonly ParticipatingSchoolSession[]
): string | null {
  const statuses = group.map(session => (session.deliveryScheduleStatus ?? '').trim().toUpperCase())
  if (statuses.length > 0 && statuses.every(status => status === 'COMPLETED')) return 'COMPLETED'
  if (statuses.includes('IN_PROGRESS')) return 'IN_PROGRESS'
  const scheduled = statuses.find(status => status === 'SCHEDULED' || status === 'UNSCHEDULED')
  return scheduled ?? null
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
 * 상세 GET educationSchedules[] 만 행으로 쓴다.
 * 지망 라벨은 MATCHED preferredScheduleBlocks.scheduleId → preferenceRank.
 * 같은 지망(같은 scheduleId, 또는 같은 rank+희망 date) 슬롯은 N차시로 묶는다.
 */
export function buildTrainedTeacherEducationProgressRows(
  sessions: readonly ParticipatingSchoolSession[] | null | undefined,
  preferredBlocks: readonly ApplicantPreferredScheduleBlock[] | null | undefined = []
): TrainedTeacherEducationProgressRow[] {
  const source = sessions ?? []
  if (source.length === 0) return []

  const matched = matchedPreferredByScheduleId(preferredBlocks)
  const groups: ParticipatingSchoolSession[][] = []
  const keyIndex = new Map<string, number>()

  source.forEach((session, index) => {
    const key = groupKey(session, matched, index)
    const existing = keyIndex.get(key)
    if (existing != null) {
      groups[existing]?.push(session)
      return
    }
    keyIndex.set(key, groups.length)
    groups.push([session])
  })

  return groups.map(group => {
    const ordered = sortSessions(group)
    const first = ordered[0]!
    const last = ordered[ordered.length - 1]!
    const startTime = splitTimeRange(first.timeRange).start
    const endTime = splitTimeRange(last.timeRange).end
    const scheduleId = sessionScheduleId(first)
    const block = scheduleId != null ? matched.get(scheduleId) : undefined
    const groupStatus = pickGroupScheduleStatus(ordered)
    const attendanceScheduleIds = ordered
      .map(sessionScheduleId)
      .filter((id): id is number => id != null)

    return {
      rowLabel: block != null ? `${block.preferenceRank}지망` : '',
      attendanceScheduleIds,
      session: {
        ...first,
        classNum: '',
        duration: `${ordered.length}차시`,
        timeRange: startTime && endTime ? `${startTime}~${endTime}` : first.timeRange,
        startAt: ordered.map(session => session.startAt?.trim() ?? '').find(Boolean) || first.startAt,
        endAt:
          [...ordered]
            .reverse()
            .map(session => session.endAt?.trim() ?? '')
            .find(Boolean) || first.endAt,
        ...(groupStatus ? { deliveryScheduleStatus: groupStatus } : { deliveryScheduleStatus: undefined }),
        status: undefined,
      },
    }
  })
}
