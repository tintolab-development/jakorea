import type {
  LectureAttendanceDetail,
  LectureAttendanceSession,
  LectureAttendanceStatusKey,
} from '@/features/program/general/model/school-detail-types'
import type { MemberLectureAttendanceResponse } from '@/features/user/api/member-program-history-api-client'

function mapSessionStatus(raw?: string): LectureAttendanceStatusKey {
  const v = raw?.trim().toUpperCase()
  if (v === 'ATTENDED') return 'attended'
  if (v === 'ABSENT') return 'absent'
  if (v === 'LATE') return 'late'
  if (v === 'NOT_HELD') return 'not_held'
  return 'not_held'
}

export function mapMemberLectureAttendanceToDetail(
  response: MemberLectureAttendanceResponse,
  fallbackStudentName: string
): LectureAttendanceDetail {
  const sessions: LectureAttendanceSession[] = (response.sessions ?? []).map((session, index) => ({
    roundNumber: session.roundNumber ?? index + 1,
    status: mapSessionStatus(session.status),
  }))

  const attended =
    response.attendedCount ??
    sessions.filter(s => s.status === 'attended' || s.status === 'late').length
  const held =
    response.heldCount ?? sessions.filter(s => s.status !== 'not_held').length
  const ratePercent = held > 0 ? Math.round((attended / held) * 100) : 0

  return {
    studentName: response.studentName?.trim() || fallbackStudentName,
    attendanceRatePercent: ratePercent,
    sessions,
  }
}
