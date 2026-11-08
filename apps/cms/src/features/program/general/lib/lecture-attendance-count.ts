import type { LectureAttendanceSession } from '../model/school-detail-types'

/** 강의 진행 회차(미진행 제외) 기준 출석 건수·진행 건수 */
export function countLectureAttendanceHeldAndAttended(sessions: LectureAttendanceSession[]): {
  attended: number
  held: number
} {
  const held = sessions.filter(s => s.status !== 'not_held').length
  const attended = sessions.filter(s => isLectureAttendanceCountedAsAttended(s.status)).length
  return { attended, held }
}

export function isLectureAttendanceHeldStatus(
  status: LectureAttendanceSession['status']
): boolean {
  return status !== 'not_held'
}

/** 출석·지각·사유 불참은 출석 건수에 포함한다(사유 불참은 수료 규칙상 결석이 아님). */
export function isLectureAttendanceCountedAsAttended(
  status: LectureAttendanceSession['status']
): boolean {
  return status === 'attended' || status === 'late' || status === 'excused'
}
