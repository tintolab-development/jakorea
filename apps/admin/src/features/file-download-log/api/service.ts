import type { FileDownloadListFilter, FileDownloadLog } from '@/entities/file-download-log/model/types'
import {
  displayLogField,
  downloadFilteredLogCsv,
  logExportDateTime,
} from '@/features/logs/shared/lib/export-log-list-csv'
import { getJAKoreaHomepageAdminAPILogsSubset } from '@/shared/api/generated/logs/logs-api'
import { toAdminListPage, type AdminListPage } from '@/shared/lib/admin-infinite-list'
import { mapFileDownloadsPageToDomain, toFileDownloadsParams } from './mappers'

function logsApi() {
  return getJAKoreaHomepageAdminAPILogsSubset()
}

export async function listFileDownloadLogsPageService(
  filter: FileDownloadListFilter,
  page: number,
): Promise<AdminListPage<FileDownloadLog>> {
  const response = await logsApi().fileDownloads(toFileDownloadsParams({ ...filter, page }))
  const { rows, total } = mapFileDownloadsPageToDomain(response)
  return toAdminListPage(rows, page, {
    page: response.page,
    totalPages: response.totalPages,
    totalCount: total,
  })
}

export async function exportFileDownloadLogsService(
  filter: FileDownloadListFilter,
): Promise<'remote-downloaded'> {
  await downloadFilteredLogCsv({
    filenameBase: '파일_다운로드_이력',
    headers: ['No.', '다운로드 파일명', '사용자', '다운로드 일시', 'IP'],
    fetchPage: page => listFileDownloadLogsPageService(filter, page),
    toCells: row => [
      displayLogField(row.fileName),
      displayLogField(row.userName),
      logExportDateTime(row.downloadedAt),
      displayLogField(row.ip),
    ],
  })
  return 'remote-downloaded'
}
