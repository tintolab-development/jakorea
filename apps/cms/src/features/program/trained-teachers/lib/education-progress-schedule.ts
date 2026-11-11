import type { ApplicantPreferredScheduleBlock } from '@/features/program/shared/model/applicant-institution'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import { resolveTrainedTeacherBlockSessionCount } from '@/features/program/trained-teachers/lib/preferred-schedule-display'

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

/** MATCHED preferredScheduleBlocks.scheduleId → 그 지망 블록(신청 때 고른 희망 차시·교시 SSOT) */
function matchedPreferredBlockByScheduleId(
  preferredBlocks: readonly ApplicantPreferredScheduleBlock[] | null | undefined
): Map<number, ApplicantPreferredScheduleBlock> {
  const matched = new Map<number, ApplicantPreferredScheduleBlock>()
  for (const block of preferredBlocks ?? []) {
    const scheduleId = preferredScheduleId(block)
    if (scheduleId == null || block.preferenceRank <= 0) continue
    if (!isMatchedPreferredStatus(block.scheduleStatus)) continue
    if (matched.has(scheduleId)) continue
    matched.set(scheduleId, block)
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
 * 교육 진행 상태 뱃지 — 「진행 대기」 / 「진행 완료」 두 가지만(CMS-FUNC-0147·0180). 「진행 중」은 쓰지 않는다.
 * COMPLETED → 진행 완료(#017EAF), SCHEDULED·IN_PROGRESS → 진행 대기(#1E8C29).
 * UNSCHEDULED · null · MATCHED 는 뱃지 없음.
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
  if (normalized === 'SCHEDULED' || normalized === 'IN_PROGRESS') {
    return {
      label: '진행 대기',
      statusClass: 'participating-institution-application-info__session-status--pending',
    }
  }
  return null
}

function parseInstant(value: string | null | undefined): number | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  const time = new Date(trimmed).getTime()
  return Number.isNaN(time) ? null : time
}

/**
 * 교육일 단위 진행 상태. 그날 마지막 차시 종료 시각(일정 `endAt` 최댓값) 전이면 진행 대기, 지나면 진행 완료.
 * 종료 시각이 없으면 서버 상태로만 판단(COMPLETED → 완료, SCHEDULED·IN_PROGRESS → 대기), 그 외는 상태 없음.
 */
function resolveDayDeliveryStatus(
  group: readonly ParticipatingSchoolSession[],
  nowMs: number
): 'COMPLETED' | 'SCHEDULED' | '' {
  const ends = group
    .map(session => parseInstant(session.endAt))
    .filter((time): time is number => time != null)
  if (ends.length > 0) return nowMs >= Math.max(...ends) ? 'COMPLETED' : 'SCHEDULED'
  const statuses = group.map(session => (session.deliveryScheduleStatus ?? '').trim().toUpperCase())
  if (statuses.length > 0 && statuses.every(status => status === 'COMPLETED')) return 'COMPLETED'
  if (statuses.some(status => status === 'SCHEDULED' || status === 'IN_PROGRESS' || status === 'COMPLETED')) {
    return 'SCHEDULED'
  }
  return ''
}

/**
 * 상세 GET educationSchedules[] → 교육 진행 일정 행(교육일 단위). 서버 배열 순서를 유지한다.
 * 같은 날 일정은 한 행 `일시(첫 시작 ~ 마지막 종료) | N차시`(CMS-FUNC-0072).
 * - N = 신청 때 그 일정(지망)에서 고른 희망 차시 수 — MATCHED preferredScheduleBlocks(scheduleId 일치)의
 *   차시 수(시간 줄 수, 없으면 sessionCount). 일정 건수로 만들지 않고, 매칭 블록이 없으면 차시를 생략한다
 *   (CMS-FUNC-0072·0277).
 * - 진행 상태: 그날 마지막 차시 종료 전 「진행 대기」, 지나면 「진행 완료」(CMS-FUNC-0147·0180).
 * 출석 조회는 묶인 일정 id 전부(`attendanceScheduleIds`)를 유지한다.
 * preferredScheduleBlocks로 행을 채우거나 MATCHED 지망을 자르지 않는다.
 */
export function buildTrainedTeacherEducationProgressRows(
  sessions: readonly ParticipatingSchoolSession[] | null | undefined,
  preferredBlocks: readonly ApplicantPreferredScheduleBlock[] | null | undefined = [],
  now: Date = new Date()
): TrainedTeacherEducationProgressRow[] {
  const source = sessions ?? []
  if (source.length === 0) return []

  const matchedBlocks = matchedPreferredBlockByScheduleId(preferredBlocks)
  const nowMs = now.getTime()

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
    // 같은 지망 블록이 여러 일정 id에 매칭돼도 한 번만 센다(지망 순위·날짜 기준)
    const blocks = [
      ...new Map(
        scheduleIds
          .map(id => matchedBlocks.get(id))
          .filter((block): block is ApplicantPreferredScheduleBlock => block != null)
          .map(block => [`${block.preferenceRank}|${block.date}`, block] as const)
      ).values(),
    ]
    const preferenceRank = blocks[0]?.preferenceRank
    const blockCounts = blocks.map(resolveTrainedTeacherBlockSessionCount)
    const sessionCount = blockCounts.every((count): count is number => count != null)
      ? blockCounts.reduce((sum, count) => sum + count, 0)
      : 0
    const ranges = group.map(session => splitTimeRange(session.timeRange ?? ''))
    const starts = ranges.map(range => range.start).filter(Boolean).sort()
    const ends = ranges.map(range => range.end).filter(Boolean).sort()
    const start = starts[0] ?? ''
    const end = ends[ends.length - 1] ?? ''
    const status = resolveDayDeliveryStatus(group, nowMs)

    return {
      rowLabel: preferenceRank != null ? `${preferenceRank}지망` : '',
      attendanceScheduleIds: scheduleIds,
      session: {
        ...first,
        classNum: '',
        duration: sessionCount > 0 ? `${sessionCount}차시` : '',
        timeRange: start && end ? `${start}~${end}` : first.timeRange,
        endAt: last.endAt ?? first.endAt ?? null,
        ...(status ? { deliveryScheduleStatus: status } : { deliveryScheduleStatus: undefined }),
        status: undefined,
      },
    }
  })
}
