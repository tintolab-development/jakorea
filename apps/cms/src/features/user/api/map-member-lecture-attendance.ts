import type {
  LectureAttendanceDetail,
  LectureAttendanceSession,
  LectureAttendanceStatusKey,
} from '@/features/program/general/model/school-detail-types'
import { isLectureAttendanceCountedAsAttended } from '@/features/program/general/lib/lecture-attendance-count'
import type { MemberLectureAttendanceResponse } from '@/features/user/api/member-program-history-api-client'

function mapSessionStatus(raw?: string): LectureAttendanceStatusKey {
  const v = raw?.trim().toUpperCase()
  if (v === 'ATTENDED' || v === 'PRESENT') return 'attended'
  if (v === 'ABSENT') return 'absent'
  if (v === 'LATE') return 'late'
  if (v === 'EXCUSED' || v === 'EXCUSED_ABSENCE') return 'excused'
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
    sessions.filter(s => isLectureAttendanceCountedAsAttended(s.status)).length
  const held =
    response.heldCount ?? sessions.filter(s => s.status !== 'not_held').length
  const ratePercent = held > 0 ? Math.round((attended / held) * 100) : 0

  return {
    studentName: response.studentName?.trim() || fallbackStudentName,
    attendanceRatePercent: ratePercent,
    sessions,
  }
}
