/**
 * 알림 목록 표시용 순수 함수 — 날짜 포맷(QA-0345).
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
