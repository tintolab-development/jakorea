import type { SessionProgress } from '@/shared/api/generated/dashboard/schemas/sessionProgress'
import type { LectureAttendanceSession, LectureAttendanceStatusKey } from '@/features/program/general/model/school-detail-types'
import {
  fetchAttendancesByScheduleIdsRemote,
  fetchParticipantEducationScopeRemote,
  fetchProgramSchedulesViaDashboardRemote,
} from '@/features/program/general/api/program-progress-api-client'
import { isProgramSchedulePreEducation } from '@/features/program/shared/lib/program-schedule-canonical'
import { PRE_EDUCATION_LECTURE_ROUND_NUMBER } from '@/features/program/general/lib/lecture-attendance-session-identity'

const SCHEDULE_PROGRESS_STATUSES = new Set([
  'COMPLETED',
  'SCHEDULED',
  'PENDING',
  'NOT_STARTED',
  'IN_PROGRESS',
])

/**
 * 참여자 1인 출석 → 수료/참가인증서 회차 상태.
 * 일정 진행값(`COMPLETED` 등)은 출석으로 보지 않는다.
 * 사유 불참(`EXCUSED`)은 수료 규칙상 결석이 아니다.
 */
export function mapParticipantAttendanceStatusToLectureCertificate(
  raw: string | null | undefined
): LectureAttendanceStatusKey | null {
  const key = (raw ?? '').trim().toUpperCase()
  if (!key || SCHEDULE_PROGRESS_STATUSES.has(key)) return null
  if (key === 'LATE') return 'late'
  if (key === 'ABSENT') return 'absent'
  if (
    key === 'PRESENT' ||
    key === 'ATTEND' ||
    key === 'ATTENDED'
  ) {
    return 'attended'
  }
  if (key === 'EXCUSED' || key === 'EXCUSED_ABSENCE' || key === 'REASON_ABSENT') {
    return 'excused'
  }
  if (key === 'NOT_HELD' || key === 'NOT_PLANNED' || key === 'CANCELLED' || key === 'CANCELED') {
    return 'not_held'
  }
  return null
}

export function mapSessionProgressToLectureAttendanceSessions(
  sessions: SessionProgress[] | undefined | null
): LectureAttendanceSession[] {
  // 사전교육(scheduleRole=PRE_EDUCATION)은 회차 0·「사전교육」 — 본교육 회차 폴백을 밀지 않는다.
  let mainEducationIndex = 0
  return [...(sessions ?? [])].flatMap(session => {
    const preEducation = isProgramSchedulePreEducation(session)
    const index = preEducation ? mainEducationIndex : mainEducationIndex++
    const status = mapParticipantAttendanceStatusToLectureCertificate(session.attendanceStatus)
    if (status == null) return []
    const scheduleId = session.scheduleId ?? session.resolvedScheduleId
    return [
      {
        roundNumber: preEducation
          ? PRE_EDUCATION_LECTURE_ROUND_NUMBER
          : (session.sessionNo ?? index + 1),
        status,
        ...(scheduleId != null ? { scheduleId } : {}),
        ...(preEducation ? { preEducation: true } : {}),
      },
    ]
  })
}

export async function hydrateParticipatingIndividualLectureAttendanceSessions(input: {
  programId: string
  participantId: string
  existing: LectureAttendanceSession[]
}): Promise<LectureAttendanceSession[]> {
  if (input.existing.length > 0) return input.existing

  const participantId = Number(input.participantId)
  if (!Number.isFinite(participantId)) return input.existing

  const scope = await fetchParticipantEducationScopeRemote(input.programId, input.participantId)
  const assignedIds: number[] = []
  const seen = new Set<number>()
  for (const raw of scope.scheduleIds ?? []) {
    if (typeof raw !== 'number' || !Number.isFinite(raw) || raw <= 0) continue
    const scheduleId = Math.trunc(raw)
    if (seen.has(scheduleId)) continue
    seen.add(scheduleId)
    assignedIds.push(scheduleId)
  }
  if (assignedIds.length === 0) return []

  const schedules = await fetchProgramSchedulesViaDashboardRemote(input.programId)
  const scheduleById = new Map(
    schedules
      .filter(
        (schedule): schedule is typeof schedule & { scheduleId: number } =>
          schedule.scheduleId != null && Number.isFinite(schedule.scheduleId)
      )
      .map(schedule => [Math.trunc(schedule.scheduleId), schedule] as const)
  )
  let mainEducationIndex = 0
  const withIds = assignedIds.map(scheduleId => {
    const schedule = scheduleById.get(scheduleId)
    const preEducation = schedule != null && isProgramSchedulePreEducation(schedule)
    const index = preEducation ? mainEducationIndex : mainEducationIndex++
    return {
      scheduleId,
      roundNumber: preEducation
        ? PRE_EDUCATION_LECTURE_ROUND_NUMBER
        : (schedule?.sessionNo ?? index + 1),
      preEducation,
    }
  }).sort((a, b) => a.roundNumber - b.roundNumber)

  const scheduleIdList = withIds.map(row => row.scheduleId)
  const attendancesByScheduleId = await fetchAttendancesByScheduleIdsRemote(
    input.programId,
    scheduleIdList
  )

  return withIds.map(row => {
    const items = attendancesByScheduleId[String(row.scheduleId)]
    const mine = Array.isArray(items)
      ? items.find(item => Number(item.participantId) === participantId)
      : undefined
    return {
      roundNumber: row.roundNumber,
      scheduleId: row.scheduleId,
      status: mapParticipantAttendanceStatusToLectureCertificate(mine?.status) ?? 'not_held',
      ...(row.preEducation ? { preEducation: true } : {}),
    }
  })
}
