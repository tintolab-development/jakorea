import type { BugIssueListFilter, BugIssueLog } from '@/entities/bug-issue-log/model/types'
import {
  displayLogField,
  downloadFilteredLogCsv,
  logExportDateTime,
} from '@/features/logs/shared/lib/export-log-list-csv'
import { getJAKoreaHomepageAdminAPILogsSubset } from '@/shared/api/generated/logs/logs-api'
import { toAdminListPage, type AdminListPage } from '@/shared/lib/admin-infinite-list'
import { mapSystemIssuesPageToDomain, toSystemIssuesParams } from './mappers'

function logsApi() {
  return getJAKoreaHomepageAdminAPILogsSubset()
}

export async function listBugIssueLogsPageService(
  filter: BugIssueListFilter,
  page: number,
): Promise<AdminListPage<BugIssueLog>> {
  const response = await logsApi().systemIssues(toSystemIssuesParams({ ...filter, page }))
  const { rows, total } = mapSystemIssuesPageToDomain(response)
  return toAdminListPage(rows, page, {
    page: response.page,
    totalPages: response.totalPages,
    totalCount: total,
  })
}

export async function exportBugIssueLogsService(
  filter: BugIssueListFilter,
): Promise<'remote-downloaded'> {
  await downloadFilteredLogCsv({
    filenameBase: '버그_이슈_이력',
    headers: ['No.', '에러 메시지', '사용자명', '발생일시'],
    fetchPage: page => listBugIssueLogsPageService(filter, page),
    toCells: row => [
      displayLogField(row.errorMessage),
      displayLogField(row.userName),
      logExportDateTime(row.occurredAt),
    ],
  })
  return 'remote-downloaded'
}
