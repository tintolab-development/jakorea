import type { PiiAccessListFilter, PiiAccessLog } from '@/entities/pii-access-log/model/types'
import {
  displayLogField,
  downloadFilteredLogCsv,
  logExportDateTime,
} from '@/features/logs/shared/lib/export-log-list-csv'
import { getJAKoreaHomepageAdminAPILogsSubset } from '@/shared/api/generated/logs/logs-api'
import { toAdminListPage, type AdminListPage } from '@/shared/lib/admin-infinite-list'
import { mapPrivacyAccessPageToDomain, toPrivacyAccessParams } from './mappers'

function logsApi() {
  return getJAKoreaHomepageAdminAPILogsSubset()
}

export async function listPiiAccessLogsPageService(
  filter: PiiAccessListFilter,
  page: number,
): Promise<AdminListPage<PiiAccessLog>> {
  const response = await logsApi().privacyAccess(toPrivacyAccessParams({ ...filter, page }))
  const { rows, total } = mapPrivacyAccessPageToDomain(response)
  return toAdminListPage(rows, page, {
    page: response.page,
    totalPages: response.totalPages,
    totalCount: total,
  })
}

export async function exportPiiAccessLogsService(
  filter: PiiAccessListFilter,
): Promise<'remote-downloaded'> {
  await downloadFilteredLogCsv({
    filenameBase: '개인정보_조회_이력',
    headers: ['No.', '조회 대상', '조회 목적', '조회자명', '조회 일시', 'IP'],
    fetchPage: page => listPiiAccessLogsPageService(filter, page),
    toCells: row => [
      displayLogField(row.targetName),
      displayLogField(row.purpose),
      displayLogField(row.accessorName),
      logExportDateTime(row.accessedAt),
      displayLogField(row.ip),
    ],
  })
  return 'remote-downloaded'
}
