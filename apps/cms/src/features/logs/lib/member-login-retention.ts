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

/** 로그인 일시 필터: 보관기간(1개월)·오늘 이후는 선택 불가 */
export function isMemberLoginHistoryDateDisabled(
  date: Dayjs,
  now: Dayjs = dayjs()
): boolean {
  if (!date?.isValid()) return true
  const cutoff = memberLoginRetentionCutoff(now).startOf('day')
  return date.isBefore(cutoff, 'day') || date.isAfter(now, 'day')
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

/** 로그인 이력 조회 `from`을 보관 기간(1개월) 안으로 맞춥니다. 없으면 cutoff를 넣습니다. */
export function clampMemberLoginLogsFromParam(
  from: string | undefined,
  now: Dayjs = dayjs()
): string {
  const cutoff = memberLoginRetentionCutoff(now).format('YYYY-MM-DD')
  const trimmed = from?.trim()
  if (!trimmed) return cutoff
  const parsed = dayjs(trimmed)
  if (!parsed.isValid() || parsed.isBefore(dayjs(cutoff), 'day')) return cutoff
  return parsed.format('YYYY-MM-DD')
}

/**
 * 사용자가 from을 보낸 경우에만 clamp합니다.
 * 미지정 시 쿼리에 from을 넣지 않습니다 — BE가 최근 1개월을 이미 적용합니다.
 */
export function applyMemberLoginRetentionFromFilter(
  filters: Record<string, string>,
  now: Dayjs = dayjs()
): Record<string, string> {
  if (!filters.from?.trim()) return filters
  return {
    ...filters,
    from: clampMemberLoginLogsFromParam(filters.from, now),
  }
}
