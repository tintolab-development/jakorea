/**
 * 참여 기관 학생 명단 > 강의 출석 내역
 * — program schedules + schedule attendances 로 조회/정정
 */

import type {
  LectureAttendanceDetail,
  LectureAttendanceSession,
  LectureAttendanceStatusKey,
} from '@/features/program/general/model/school-detail-types'
import { countLectureAttendanceHeldAndAttended } from '@/features/program/general/lib/lecture-attendance-count'
import {
  bulkUpsertProgramAttendancesRemote,
  fetchProgramSchedulesViaDashboardRemote,
  fetchScheduleAttendancesRemote,
} from '@/features/program/general/api/program-progress-api-client'

function mapApiStatusToLecture(status?: string): LectureAttendanceStatusKey {
  const normalized = (status ?? '').trim().toUpperCase()
  if (normalized === 'LATE') return 'late'
  if (normalized === 'ABSENT' || normalized === 'EXCUSED' || normalized === 'EXCUSED_ABSENCE') {
    return 'absent'
  }
  if (
    normalized === 'PRESENT' ||
    normalized === 'ATTEND' ||
    normalized === 'ATTENDED'
  ) {
    return 'attended'
  }
  if (normalized === 'NOT_HELD') return 'not_held'
  return 'not_held'
}

function mapLectureStatusToApi(
  status: LectureAttendanceStatusKey
): string | null {
  if (status === 'attended') return 'PRESENT'
  if (status === 'late') return 'LATE'
  if (status === 'absent') return 'ABSENT'
  return null
}

export async function fetchStudentLectureAttendanceByParticipantRemote(input: {
  programId: string
  participantId: number
  studentName: string
}): Promise<LectureAttendanceDetail> {
  const schedules = await fetchProgramSchedulesViaDashboardRemote(input.programId)
  const withIds = schedules
    .map((schedule, index) => ({
      schedule,
      scheduleId: schedule.scheduleId,
      roundNumber: schedule.sessionNo ?? index + 1,
    }))
    .filter(
      (row): row is typeof row & { scheduleId: number } =>
        row.scheduleId != null && Number.isFinite(Number(row.scheduleId))
    )
    .sort((a, b) => a.roundNumber - b.roundNumber)

  const sessions: LectureAttendanceSession[] = await Promise.all(
    withIds.map(async row => {
      const scheduleId = String(row.scheduleId)
      let items: Awaited<ReturnType<typeof fetchScheduleAttendancesRemote>> = []
      try {
        items = await fetchScheduleAttendancesRemote(input.programId, scheduleId)
      } catch {
        items = []
      }
      const mine = items.find(item => Number(item.participantId) === input.participantId)
      return {
        roundNumber: row.roundNumber,
        scheduleId: row.scheduleId,
        status: mine ? mapApiStatusToLecture(mine.status) : 'not_held',
      }
    })
  )

  const { attended, held } = countLectureAttendanceHeldAndAttended(sessions)
  return {
    studentName: input.studentName,
    attendanceRatePercent: held > 0 ? Math.round((attended / held) * 100) : 0,
    sessions,
  }
}

/** 회차별 scheduleId 기준 bulk-upsert (강의 미진행은 전송 생략) */
export async function saveStudentLectureAttendanceByParticipantRemote(input: {
  programId: string
  participantId: number
  sessions: LectureAttendanceSession[]
}): Promise<void> {
  const editable = input.sessions.filter(
    session => session.scheduleId != null && mapLectureStatusToApi(session.status) != null
  )

  await Promise.all(
    editable.map(async session => {
      const status = mapLectureStatusToApi(session.status)
      if (status == null || session.scheduleId == null) return
      await bulkUpsertProgramAttendancesRemote(input.programId, {
        scheduleId: session.scheduleId,
        attendances: [
          {
            participantId: input.participantId,
            status,
          },
        ],
      })
    })
  )
}
