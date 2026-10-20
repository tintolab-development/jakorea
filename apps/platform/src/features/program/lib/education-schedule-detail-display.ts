import {
  formatDisplayDateRange,
  normalizeScheduleDisplayLabel,
} from '../../../shared/lib/format-display-date.ts'

/** 프로그램 상세 세부내용 — 교육 일정 카드 제목 */
export function educationScheduleDetailCardLabel(index: number, total: number): string {
  if (total <= 1) return '교육 일정'
  return `교육 일정 ${index + 1}`
}

/** 기간 지정 한 줄 — 시각을 빼고 날짜만 */
export function formatEducationSchedulePeriodLineDateOnly(line: string): string {
  const trimmed = line.trim()
  if (!trimmed) return ''
  return normalizeScheduleDisplayLabel(trimmed, { dateOnly: true }) || trimmed
}

/**
 * 기간 지정 교육 일정은 서버가 계산한 range만 표시한다.
 * educationScheduleLines는 신청 폼·보조 데이터이며 기간을 추론하는 입력으로 쓰지 않는다.
 */
export function formatEducationScheduleRangeForDetailCard(
  start: string | null | undefined,
  end: string | null | undefined,
): string {
  return formatDisplayDateRange(start, end, { empty: '' })
}

export function formatEducationScheduleLineForDetailCard(
  line: string,
  mode: 'date' | 'period'
): string {
  const trimmed = line.trim()
  if (!trimmed) return ''
  if (mode === 'period') return formatEducationSchedulePeriodLineDateOnly(trimmed)
  return normalizeScheduleDisplayLabel(trimmed)
}
