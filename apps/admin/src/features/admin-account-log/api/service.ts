import { formatAdminAccountActionLabel } from '@/entities/admin-account-log/lib/format-action-label'
import type { AdminAccountListFilter, AdminAccountLog } from '@/entities/admin-account-log/model/types'
import {
  displayLogField,
  downloadFilteredLogCsv,
  logExportDateTime,
} from '@/features/logs/shared/lib/export-log-list-csv'
import { getJAKoreaHomepageAdminAPILogsSubset } from '@/shared/api/generated/logs/logs-api'
import { toAdminListPage, type AdminListPage } from '@/shared/lib/admin-infinite-list'
import { mapAdminAccountActionsPageToDomain, toAdminAccountActionsParams } from './mappers'

function logsApi() {
  return getJAKoreaHomepageAdminAPILogsSubset()
}

export async function listAdminAccountLogsPageService(
  filter: AdminAccountListFilter,
  page: number,
): Promise<AdminListPage<AdminAccountLog>> {
  const response = await logsApi().adminAccountActions(
    toAdminAccountActionsParams({ ...filter, page }),
  )
  const { rows, total } = mapAdminAccountActionsPageToDomain(response)
  return toAdminListPage(rows, page, {
    page: response.page,
    totalPages: response.totalPages,
    totalCount: total,
  })
}

export async function exportAdminAccountLogsService(
  filter: AdminAccountListFilter,
): Promise<'remote-downloaded'> {
  await downloadFilteredLogCsv({
    filenameBase: '관리자_계정_처리_이력',
    headers: ['No.', '관리자명', '아이디', '내역', '처리일시', 'IP'],
    fetchPage: page => listAdminAccountLogsPageService(filter, page),
    toCells: row => [
      displayLogField(row.name),
      displayLogField(row.loginId),
      formatAdminAccountActionLabel(row.actionType),
      logExportDateTime(row.processedAt),
      displayLogField(row.ip),
    ],
  })
  return 'remote-downloaded'
}
