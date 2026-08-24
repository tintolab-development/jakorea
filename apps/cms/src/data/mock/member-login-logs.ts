/**
 * 회원 로그인 이력 mock (시안 130건)
 */

import dayjs from 'dayjs'
import type { MemberLoginLog } from '@/types/member-login-log'

const ADMIN_NAMES = ['홍길동', '김철수', '이영희', '박민수', '최지훈'] as const

const LOGIN_IDS = [
  'helpdesk2023@gmail.com',
  'admin.kim@jakorea.org',
  'master@jakorea.org',
  'ops.lee@jakorea.org',
  'pm.park@jakorea.org',
] as const

function includesIgnoreCase(value: string, query: string): boolean {
  return value.toLowerCase().includes(query.toLowerCase())
}

function buildSeed(now = dayjs()): MemberLoginLog[] {
  const rows: MemberLoginLog[] = []
  for (let i = 0; i < 130; i += 1) {
    rows.push({
      id: `mlh-${String(i + 1).padStart(3, '0')}`,
      adminName: ADMIN_NAMES[i % ADMIN_NAMES.length]!,
      loginId: LOGIN_IDS[i % LOGIN_IDS.length]!,
      loggedAt: now.subtract(i * 5, 'hour').toISOString(),
      ipAddress: `14.${90 + (i % 10)}.${80 + (i % 20)}.${100 + (i % 100)}`,
    })
  }
  return rows
}

const SEED = buildSeed()

export function listMockMemberLoginLogs(filters: Record<string, string> = {}): MemberLoginLog[] {
  const adminName = filters.adminName?.trim() ?? filters.name?.trim() ?? ''
  const loginId = filters.loginId?.trim() ?? ''
  const from = filters.from?.trim()
  const to = filters.to?.trim()

  return SEED.filter(row => {
    if (adminName && !includesIgnoreCase(row.adminName, adminName)) return false
    if (loginId && !includesIgnoreCase(row.loginId, loginId)) return false
    if (from && to) {
      const loggedAt = dayjs(row.loggedAt)
      if (loggedAt.isBefore(dayjs(from).startOf('day')) || loggedAt.isAfter(dayjs(to).endOf('day'))) {
        return false
      }
    }
    return true
  }).sort((a, b) => dayjs(b.loggedAt).valueOf() - dayjs(a.loggedAt).valueOf())
}
