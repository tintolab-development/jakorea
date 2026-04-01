/**
 * 강의 출석 표시용 — "2/4", "4 / 4" 형식에서 출석(분자) 파싱
 */

export function parseLectureAttendanceAttended(raw: string | undefined): number {
  if (raw == null || !String(raw).trim()) return 0
  const m = String(raw).trim().match(/^(\d+)\s*\/\s*\d+/)
  if (!m) return 0
  const n = Number.parseInt(m[1], 10)
  return Number.isFinite(n) ? n : 0
}

/** 출석 1회 이상이면 링크 스타일(파란색·밑줄) 적용 */
export function lectureAttendanceHasAtLeastOne(raw: string | undefined): boolean {
  return parseLectureAttendanceAttended(raw) >= 1
}
