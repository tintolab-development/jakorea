const KOREAN_DATE_WITH_WEEKDAY_RE = /(\d{2}년\s+\d{1,2}월\s+\d{1,2}일\([^)]+\))/

/** 프로그램 상세 세부내용 — 교육 일정 카드 제목 */
export function educationScheduleDetailCardLabel(index: number, total: number): string {
  if (total <= 1) return '교육 일정'
  return `교육 일정 ${index + 1}`
}

function extractKoreanScheduleDateToken(part: string): string | null {
  const match = part.trim().match(KOREAN_DATE_WITH_WEEKDAY_RE)
  return match ? match[1] : null
}

/** 기간 지정 한 줄 — `26년 … 0:00 ~ 26년 … 23:59` → 날짜만 */
export function formatEducationSchedulePeriodLineDateOnly(line: string): string {
  const trimmed = line.trim()
  if (!trimmed) return ''

  const segments = trimmed.split(/\s*~\s*/).map(segment => segment.trim()).filter(Boolean)
  if (segments.length < 2) return trimmed

  const startDate = extractKoreanScheduleDateToken(segments[0])
  const endDate = extractKoreanScheduleDateToken(segments[segments.length - 1])
  if (!startDate || !endDate) return trimmed
  if (startDate === endDate) return startDate
  return `${startDate} ~ ${endDate}`
}

export function formatEducationScheduleLineForDetailCard(
  line: string,
  mode: 'date' | 'period'
): string {
  const trimmed = line.trim()
  if (!trimmed) return ''
  if (mode === 'period') return formatEducationSchedulePeriodLineDateOnly(trimmed)
  return trimmed
}
