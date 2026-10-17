import type { SessionProgress } from '@/shared/api/generated/dashboard/schemas/sessionProgress'
import type { LectureAttendanceSession, LectureAttendanceStatusKey } from '@/features/program/general/model/school-detail-types'
import {
  fetchAttendancesByScheduleIdsRemote,
  fetchProgramSchedulesViaDashboardRemote,
} from '@/features/program/general/api/program-progress-api-client'

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
    key === 'ATTENDED' ||
    key === 'EXCUSED' ||
    key === 'EXCUSED_ABSENCE' ||
    key === 'REASON_ABSENT'
  ) {
    return 'attended'
  }
  if (key === 'NOT_HELD' || key === 'NOT_PLANNED' || key === 'CANCELLED' || key === 'CANCELED') {
    return 'not_held'
  }
  return null
}

export function mapSessionProgressToLectureAttendanceSessions(
  sessions: SessionProgress[] | undefined | null
): LectureAttendanceSession[] {
  return [...(sessions ?? [])].flatMap((session, index) => {
    const status = mapParticipantAttendanceStatusToLectureCertificate(session.attendanceStatus)
    if (status == null) return []
    const scheduleId = session.scheduleId ?? session.resolvedScheduleId
    return [
      {
        roundNumber: session.sessionNo ?? index + 1,
        status,
        ...(scheduleId != null ? { scheduleId } : {}),
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

  const schedules = await fetchProgramSchedulesViaDashboardRemote(input.programId)
  const withIds = schedules
    .map((schedule, index) => ({
      scheduleId: schedule.scheduleId,
      roundNumber: schedule.sessionNo ?? index + 1,
    }))
    .filter(
      (row): row is { scheduleId: number; roundNumber: number } =>
        row.scheduleId != null && Number.isFinite(Number(row.scheduleId))
    )
    .sort((a, b) => a.roundNumber - b.roundNumber)

  const scheduleIdList = withIds.map(row => row.scheduleId)
  const attendancesByScheduleId = await fetchAttendancesByScheduleIdsRemote(
    input.programId,
    scheduleIdList
  )

  return withIds.flatMap(row => {
    const items = attendancesByScheduleId[String(row.scheduleId)]
    if (!Array.isArray(items) || items.length === 0) return []
    const mine = items.find(item => Number(item.participantId) === participantId)
    return [{
      roundNumber: row.roundNumber,
      scheduleId: row.scheduleId,
      status: mapParticipantAttendanceStatusToLectureCertificate(mine?.status) ?? 'not_held',
    }]
  })
}
