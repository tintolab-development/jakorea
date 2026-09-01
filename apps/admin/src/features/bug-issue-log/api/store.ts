/**
 * 버그/이슈 이력 — local seed
 */

import type {
  BugIssueListFilter,
  BugIssueListResult,
  BugIssueLog,
} from '@/entities/bug-issue-log/model/types'
import {
  includesIgnoreCase,
  isIsoInDateRange,
} from '@/features/logs/shared/lib/filter-date-range'

const MESSAGES = [
  '[503] Service Unavailable - Database connection failed',
  '[500] Internal Server Error - Unexpected token',
  '[504] Gateway Timeout - Upstream service did not respond',
  '[401] Unauthorized - Session expired',
  '[403] Forbidden - Missing permission',
]

const NAMES = ['홍길동', '김철수', '이명희', '박민수', '최지훈', '정은지']

function buildSeed(): BugIssueLog[] {
  const rows: BugIssueLog[] = []
  const base = Date.UTC(2026, 2, 30, 1, 15, 45)
  for (let i = 0; i < 130; i += 1) {
    const at = new Date(base - i * 5_100_000)
    rows.push({
      id: `bug-${i + 1}`,
      errorMessage: MESSAGES[i % MESSAGES.length]!,
      userName: NAMES[i % NAMES.length]!,
      occurredAt: at.toISOString(),
    })
  }
  return rows
}

const SEED = buildSeed()

export function listBugIssueLogs(filter: BugIssueListFilter): BugIssueListResult {
  let rows = [...SEED]
  if (filter.userName) {
    rows = rows.filter(r => includesIgnoreCase(r.userName, filter.userName!))
  }
  rows = rows.filter(r =>
    isIsoInDateRange(r.occurredAt, filter.from, filter.to)
  )
  rows.sort(
    (a, b) =>
      new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
  )
  return { rows, total: rows.length }
}
