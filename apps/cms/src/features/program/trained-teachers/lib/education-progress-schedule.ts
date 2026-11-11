import type { ApplicantPreferredScheduleBlock } from '@/features/program/shared/model/applicant-institution'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'

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

/** 같은 날 일정들의 진행 상태 — 모두 같으면 그 값, 진행 중·완료가 섞이면 진행 중, 그 외 첫 값 */
function combineDayDeliveryStatus(statuses: readonly string[]): string {
  const known = statuses.filter(Boolean)
  if (known.length === 0) return ''
  const unique = [...new Set(known)]
  if (unique.length === 1) return unique[0]!
  if (unique.includes('IN_PROGRESS') || unique.includes('COMPLETED')) return 'IN_PROGRESS'
  return known[0]!
}

/**
 * 상세 GET educationSchedules[] → 교육 진행 일정 행. 서버 배열 순서를 유지한다.
 * TT 차시 = 그날 수업 개수이고 운영 일정 1건 = 1차시(1시간 슬롯)이므로, 같은 날 일정을 한 행으로 묶어
 * `일시(첫 시작 ~ 마지막 종료) | N차시`로 표시한다(CMS-FUNC-0072 — 2차시 신청은 일정 두 건을 한 줄로).
 * 출석 조회는 묶인 일정 id 전부(`attendanceScheduleIds`)를 유지한다.
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

  const groups: ParticipatingSchoolSession[][] = []
  const groupByDate = new Map<string, ParticipatingSchoolSession[]>()
  for (const session of source) {
    const dateKey = (session.date ?? '').trim()
    const existing = dateKey ? groupByDate.get(dateKey) : undefined
    if (existing) {
      existing.push(session)
      continue
    }
    const group = [session]
    groups.push(group)
    if (dateKey) groupByDate.set(dateKey, group)
  }

  return groups.map(group => {
    const first = group[0]!
    const last = group[group.length - 1]!
    const scheduleIds = group
      .map(sessionScheduleId)
      .filter((id): id is number => id != null)
    const preferenceRank = scheduleIds
      .map(id => matchedRank.get(id))
      .find((rank): rank is number => rank != null)
    const ranges = group.map(session => splitTimeRange(session.timeRange ?? ''))
    const starts = ranges.map(range => range.start).filter(Boolean).sort()
    const ends = ranges.map(range => range.end).filter(Boolean).sort()
    const start = starts[0] ?? ''
    const end = ends[ends.length - 1] ?? ''
    const status = combineDayDeliveryStatus(
      group.map(session => (session.deliveryScheduleStatus ?? '').trim().toUpperCase())
    )

    return {
      rowLabel: preferenceRank != null ? `${preferenceRank}지망` : '',
      attendanceScheduleIds: scheduleIds,
      session: {
        ...first,
        classNum: '',
        duration: `${group.length}차시`,
        timeRange: start && end ? `${start}~${end}` : first.timeRange,
        endAt: last.endAt ?? first.endAt ?? null,
        ...(status ? { deliveryScheduleStatus: status } : { deliveryScheduleStatus: undefined }),
        status: undefined,
      },
    }
  })
}
