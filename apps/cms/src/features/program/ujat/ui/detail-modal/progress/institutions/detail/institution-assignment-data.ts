/** 출결 담당자 — null이면 UI에서 「미정」 (remote API 연동 전) */
export function getAttendanceManagerForSchedule(
  _institutionId: string,
  _isoDate: string
): string | null {
  return null
}

export function getVolunteersForClass(
  _institutionId: string,
  _isoDate: string,
  _gradeLabel: string,
  _classNo: number
): { volunteerA: string; volunteerB: string } {
  return { volunteerA: '-', volunteerB: '-' }
}
