/**
 * 날짜 포맷팅 유틸리티
 *
 * 텍스트 공통 정책:
 * - 목록 날짜: YYYY.MM.DD (월·일은 2자리)
 * - 날짜+시간: YYYY.MM.DD HH:mm
 */

import dayjs from 'dayjs'

const defaultLocale = 'ko-KR'

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

/** 목록 등 날짜(시간 제외) 표시 — 예: 2025.09.15 */
export function formatDateDot(value: Date | string | number | null | undefined): string {
  if (value == null || value === '') return '-'
  const parsed = parseDisplayDate(value)
  if (!parsed.isValid()) return '-'
  return parsed.format('YYYY.MM.DD')
}

/** 목록 등 날짜+시간 표시 — 예: 2025.09.15 14:30 */
export function formatDateTimeDot(value: Date | string | number | null | undefined): string {
  if (value == null || value === '') return '-'
  const parsed = parseDisplayDate(value)
  if (!parsed.isValid()) return '-'
  return parsed.format('YYYY.MM.DD HH:mm')
}

/** 목록 기간 표시 — 예: 2025.09.15 ~ 2025.12.31 */
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

export function formatDate(value: Date | string | number, options: Intl.DateTimeFormatOptions = {}) {
  const date = value instanceof Date ? value : new Date(value)
  return new Intl.DateTimeFormat(defaultLocale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  }).format(date)
}

export function timeSince(value: Date | string | number) {
  const input = value instanceof Date ? value : new Date(value)
  const diff = Date.now() - input.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}시간 전`
  const days = Math.floor(hours / 24)
  return `${days}일 전`
}

