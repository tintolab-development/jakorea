/**
 * 알림 안내 팝업 본문 강조 — 시안 「시스템 안내 팝업」 프로그램 신규 신청자·기관·강사·봉사자
 * 「…신청자 수는 **N명**입니다.」「…신청 기관 수는 **N개**입니다.」
 * 문구는 서버 message 그대로 쓰고, 전일 신규 신청 합산 알림의 첫 「숫자+명/개」만 굵게 나눈다.
 */

import type { Notification } from '@/features/dashboard/api/notification-service'

export interface NotificationBodySegment {
  text: string
  bold: boolean
}

/** BE `ProgramApplicationDailyDigestService` 신청 유형별 이벤트 (BE main d9a1a16) */
const EMPHASIS_EVENT_TYPES: ReadonlySet<string> = new Set([
  'ADMIN_PROGRAM_APPLICATION_SUBMITTED',
  'ADMIN_ORGANIZATION_APPLICATION_SUBMITTED',
  'ADMIN_INSTRUCTOR_APPLICATION_SUBMITTED',
  'ADMIN_VOLUNTEER_APPLICATION_SUBMITTED',
  /** 예전 FE 키 — BE는 보내지 않는다 */
  'ADMIN_PROGRAM_APPLICATION_DAILY_SUMMARY',
])

/** 「3명」「1,234명」「2개」 */
const COUNT_PATTERN = /\d[\d,]*[명개]/

export function splitNotificationBodyEmphasis(
  notification: Pick<Notification, 'body' | 'target'>
): NotificationBodySegment[] {
  const body = notification.body ?? ''
  const eventType = notification.target?.eventType?.trim().toUpperCase()
  if (!body || !eventType || !EMPHASIS_EVENT_TYPES.has(eventType)) {
    return body ? [{ text: body, bold: false }] : []
  }
  const match = COUNT_PATTERN.exec(body)
  if (!match) return [{ text: body, bold: false }]
  const start = match.index
  const end = start + match[0].length
  return [
    { text: body.slice(0, start), bold: false },
    { text: match[0], bold: true },
    { text: body.slice(end), bold: false },
  ].filter(segment => segment.text.length > 0)
}
