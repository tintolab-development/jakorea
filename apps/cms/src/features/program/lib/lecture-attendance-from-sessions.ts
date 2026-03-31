import type { LectureAttendanceSession } from '../model/school-detail-types'

/** 회차별 세션 배열 → 테이블·API용 `출석회차수/전체회차수` 문자열 */
export function lectureAttendanceStringFromSessions(
  sessions: LectureAttendanceSession[]
): string {
  if (!sessions.length) return '0/0'
  const attended = sessions.filter(s => s.status === 'attended').length
  return `${attended}/${sessions.length}`
}
