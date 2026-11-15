/**
 * 알림 목록 표시용 순수 함수 — 날짜 포맷(QA-0345), 회색 둘째 줄 문구.
 * 시안(1142:74713): 시간 없이 `YYYY.MM.DD`만 노출.
 */

import type { DateValue } from '@/types'

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

/** `YYYY.MM.DD` (브라우저 로컬 날짜). 해석 불가 값은 빈 문자열 */
export function formatNotificationDate(createdAt: DateValue): string {
  const d = new Date(createdAt)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}.${pad2(d.getMonth() + 1)}.${pad2(d.getDate())}`
}

/** 본문의 첫 줄(앞뒤 공백 제거, 빈 줄 건너뜀). 본문이 비면 빈 문자열 */
export function notificationBodyFirstLine(body: string | null | undefined): string {
  if (!body) return ''
  for (const line of body.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (trimmed) return trimmed
  }
  return ''
}

/**
 * GNB 알림 목록 회색 둘째 줄 — 프로그램명, 없으면 본문 첫 줄(QA: 항목 높이 유지).
 * 둘 다 없으면 빈 문자열(줄 자리는 화면에서 유지).
 */
export function resolveNotificationSubLine(notification: {
  programName?: string
  body?: string
}): { text: string; source: 'program' | 'body' | 'none' } {
  const programName = notification.programName?.trim()
  if (programName) return { text: programName, source: 'program' }
  const firstLine = notificationBodyFirstLine(notification.body)
  if (firstLine) return { text: firstLine, source: 'body' }
  return { text: '', source: 'none' }
}
