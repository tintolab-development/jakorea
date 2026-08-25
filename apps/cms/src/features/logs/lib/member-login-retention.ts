/**
 * 회원 로그인 이력 보관 기간 — 수집일로부터 1개월 후 파기 (기획, 고객사 확인 필요).
 */

import dayjs, { type Dayjs } from 'dayjs'
import type { DateValue } from '@/types'
import type { MemberLoginLog } from '@/types/member-login-log'

export const MEMBER_LOGIN_RETENTION_MONTHS = 1

export function memberLoginRetentionCutoff(now: Dayjs = dayjs()): Dayjs {
  return now.subtract(MEMBER_LOGIN_RETENTION_MONTHS, 'month')
}

export function isMemberLoginLogWithinRetention(
  loggedAt: DateValue,
  now: Dayjs = dayjs()
): boolean {
  const at = dayjs(loggedAt)
  if (!at.isValid()) return false
  return !at.isBefore(memberLoginRetentionCutoff(now))
}

export function filterMemberLoginLogsByRetention(
  rows: MemberLoginLog[],
  now: Dayjs = dayjs()
): MemberLoginLog[] {
  return rows.filter(row => isMemberLoginLogWithinRetention(row.loggedAt, now))
}
