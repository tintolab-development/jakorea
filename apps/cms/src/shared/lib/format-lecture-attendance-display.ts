/**
 * 강의 출석 비율 셀 표시: "1/4" → "1 / 4" (슬래시 주변 띄어쓰기 한 칸)
 * API·상태값은 기존처럼 "n/m" 유지하고, UI에서만 포맷
 */
export function formatLectureAttendanceCellDisplay(value?: string): string {
  const raw = (value ?? '0/0').trim()
  const m = raw.match(/^(\d+)\s*\/\s*(\d+)$/)
  if (m) return `${m[1]} / ${m[2]}`
  return raw
}
