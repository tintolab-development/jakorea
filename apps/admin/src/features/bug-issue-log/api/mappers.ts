/**
 * 버그/이슈 이력 — OpenAPI ↔ 도메인 매핑
 */

import type {
  BugIssueListFilter,
  BugIssueListResult,
  BugIssueLog,
} from '@/entities/bug-issue-log/model/types'
import type { ExportSystemIssuesParams } from '@/shared/api/generated/logs/schemas/exportSystemIssuesParams'
import type { PageResponseSystemIssueLogItem } from '@/shared/api/generated/logs/schemas/pageResponseSystemIssueLogItem'
import type { SystemIssueLogItem } from '@/shared/api/generated/logs/schemas/systemIssueLogItem'
import type { SystemIssuesParams } from '@/shared/api/generated/logs/schemas/systemIssuesParams'

export const LIST_PAGE_SIZE = 20

export function toSystemIssuesParams(filter: BugIssueListFilter): SystemIssuesParams {
  const params: SystemIssuesParams = {
    page: 0,
    size: LIST_PAGE_SIZE,
  }
  const userName = filter.userName?.trim()
  if (userName) params.userName = userName
  if (filter.from?.trim()) params.from = filter.from.trim()
  if (filter.to?.trim()) params.to = filter.to.trim()
  return params
}

export function toSystemIssuesExportParams(
  filter: BugIssueListFilter,
): ExportSystemIssuesParams {
  const params: ExportSystemIssuesParams = {}
  const userName = filter.userName?.trim()
  if (userName) params.userName = userName
  if (filter.from?.trim()) params.from = filter.from.trim()
  if (filter.to?.trim()) params.to = filter.to.trim()
  return params
}

function mapItem(row: SystemIssueLogItem): BugIssueLog {
  return {
    id: String(row.id ?? ''),
    errorMessage: row.errorMessage ?? '',
    userName: row.userName ?? '',
    occurredAt: row.occurredAt ?? '',
  }
}

export function mapSystemIssuesPageToDomain(
  response: PageResponseSystemIssueLogItem,
): BugIssueListResult {
  const rows = (response.items ?? []).map(mapItem)
  return {
    rows,
    total: typeof response.totalCount === 'number' ? response.totalCount : rows.length,
  }
}
