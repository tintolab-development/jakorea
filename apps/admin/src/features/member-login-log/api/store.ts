/**
 * 회원 로그인 이력 — local seed
 */

import type {
  MemberLoginAudience,
  MemberLoginListFilter,
  MemberLoginListResult,
  MemberLoginLog,
} from '@/entities/member-login-log/model/types'
import {
  includesIgnoreCase,
  isIsoInDateRange,
} from '@/features/logs/shared/lib/filter-date-range'

const NAMES = [
  '홍길동',
  '김철수',
  '이명희',
  '박민수',
  '최지훈',
  '정은지',
  '이수진',
  '김명호',
  '배수현',
  '홍성민',
  '유정민',
  '오상민',
  '문지혜',
]

const ADMIN_IDS = [
  'helpdesk2023@gmail.com',
  'admin.kim@jakorea.org',
  'master@jakorea.org',
  'ops.lee@jakorea.org',
]

const USER_IDS = [
  'user01@example.com',
  'member02@example.com',
  'student03@naver.com',
  'parent04@gmail.com',
]

function buildSeed(): MemberLoginLog[] {
  const rows: MemberLoginLog[] = []
  const base = Date.UTC(2026, 2, 30, 1, 10, 32)
  for (let i = 0; i < 130; i += 1) {
    const audience: MemberLoginAudience = i % 3 === 0 ? 'user' : 'admin'
    const name = NAMES[i % NAMES.length]!
    const loginId =
      audience === 'admin'
        ? ADMIN_IDS[i % ADMIN_IDS.length]!
        : USER_IDS[i % USER_IDS.length]!
    const at = new Date(base - i * 3_600_000 * 5)
    rows.push({
      id: `login-${audience}-${i + 1}`,
      audience,
      name,
      loginId,
      loggedAt: at.toISOString(),
      ip: `14.${90 + (i % 10)}.${80 + (i % 20)}.${100 + (i % 100)}`,
    })
  }
  return rows
}

const SEED = buildSeed()

export function listMemberLoginLogs(
  filter: MemberLoginListFilter
): MemberLoginListResult {
  let rows = SEED.filter(r => r.audience === filter.audience)
  if (filter.name) {
    rows = rows.filter(r => includesIgnoreCase(r.name, filter.name!))
  }
  if (filter.loginId) {
    rows = rows.filter(r => includesIgnoreCase(r.loginId, filter.loginId!))
  }
  rows = rows.filter(r => isIsoInDateRange(r.loggedAt, filter.from, filter.to))
  rows = [...rows].sort(
    (a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime()
  )
  return { rows, total: rows.length }
}
