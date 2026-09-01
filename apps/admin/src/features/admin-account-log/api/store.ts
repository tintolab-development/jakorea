/**
 * 관리자 계정 처리 이력 — local seed
 */

import {
  ADMIN_ACCOUNT_ACTION_TYPES,
  type AdminAccountActionType,
  type AdminAccountListFilter,
  type AdminAccountListResult,
  type AdminAccountLog,
} from '@/entities/admin-account-log/model/types'
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
]

const LOGIN_IDS = [
  'helpdesk2023@gmail.com',
  'admin.kim@jakorea.org',
  'master@jakorea.org',
  'ops.lee@jakorea.org',
  'cs.park@jakorea.org',
]

function buildSeed(): AdminAccountLog[] {
  const rows: AdminAccountLog[] = []
  const base = Date.UTC(2026, 2, 30, 1, 10, 32)
  for (let i = 0; i < 130; i += 1) {
    const actionType =
      ADMIN_ACCOUNT_ACTION_TYPES[i % ADMIN_ACCOUNT_ACTION_TYPES.length]!
    const at = new Date(base - i * 2_700_000 * 3)
    rows.push({
      id: `admin-acct-${i + 1}`,
      name: NAMES[i % NAMES.length]!,
      loginId: LOGIN_IDS[i % LOGIN_IDS.length]!,
      actionType,
      processedAt: at.toISOString(),
      ip: `14.${91 + (i % 9)}.${50 + (i % 30)}.${40 + (i % 50)}`,
    })
  }
  return rows
}

const SEED = buildSeed()

export function listAdminAccountLogs(
  filter: AdminAccountListFilter
): AdminAccountListResult {
  let rows = [...SEED]
  if (filter.name) {
    rows = rows.filter(r => includesIgnoreCase(r.name, filter.name!))
  }
  if (filter.loginId) {
    rows = rows.filter(r => includesIgnoreCase(r.loginId, filter.loginId!))
  }
  if (filter.actionType) {
    const t = filter.actionType as AdminAccountActionType
    rows = rows.filter(r => r.actionType === t)
  }
  rows = rows.filter(r =>
    isIsoInDateRange(r.processedAt, filter.from, filter.to)
  )
  rows.sort(
    (a, b) =>
      new Date(b.processedAt).getTime() - new Date(a.processedAt).getTime()
  )
  return { rows, total: rows.length }
}
