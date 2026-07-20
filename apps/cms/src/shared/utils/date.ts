/**
 * 날짜 포맷팅 유틸리티
 */

import dayjs from 'dayjs'

const defaultLocale = 'ko-KR'

/** 목록 등 날짜(시간 제외) 표시 — 예: 2025.09.15 */
export function formatDateDot(value: Date | string | number | null | undefined): string {
  if (value == null || value === '') return '-'
  const parsed = dayjs(value)
  if (!parsed.isValid()) return '-'
  return parsed.format('YYYY.MM.DD')
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

