/**
 * 목록·화면 텍스트 공통 정책
 * - 날짜: YYYY.MM.DD (월·일 2자리)
 * - 날짜+시간: YYYY.MM.DD HH:mm
 * - 숫자: 천단위 구분, 후행 0 제거
 */

import dayjs from 'dayjs'

function parseDisplayDate(value: Date | string | number) {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    const dotted = /^(\d{4})[.-](\d{1,2})[.-](\d{1,2})/.exec(trimmed)
    if (dotted) {
      const iso = `${dotted[1]}-${dotted[2].padStart(2, '0')}-${dotted[3].padStart(2, '0')}`
      const rest = trimmed.slice(dotted[0].length).trim()
      return dayjs(rest ? `${iso} ${rest}` : iso)
    }
  }
  return dayjs(value)
}

export function formatDateDot(value: Date | string | number | null | undefined): string {
  if (value == null || value === '') return '-'
  const parsed = parseDisplayDate(value)
  if (!parsed.isValid()) return '-'
  return parsed.format('YYYY.MM.DD')
}

export function formatDateTimeDot(value: Date | string | number | null | undefined): string {
  if (value == null || value === '') return '-'
  const parsed = parseDisplayDate(value)
  if (!parsed.isValid()) return '-'
  return parsed.format('YYYY.MM.DD HH:mm')
}

export function formatDateRangeDot(
  start: Date | string | number | null | undefined,
  end: Date | string | number | null | undefined
): string {
  if (start == null || start === '' || end == null || end === '') return '-'
  const startLabel = formatDateDot(start)
  const endLabel = formatDateDot(end)
  if (startLabel === '-' || endLabel === '-') return '-'
  return `${startLabel} ~ ${endLabel}`
}

export function formatNumberDisplay(value: number | string | null | undefined): string {
  if (value == null || value === '') return '-'
  const numeric = typeof value === 'number' ? value : Number(String(value).replace(/,/g, ''))
  if (!Number.isFinite(numeric)) return '-'
  return numeric.toLocaleString('ko-KR', { maximumFractionDigits: 20 })
}
