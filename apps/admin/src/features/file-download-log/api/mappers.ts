/**
 * 파일 다운로드 이력 — OpenAPI ↔ 도메인 매핑
 */

import type {
  FileDownloadListFilter,
  FileDownloadListResult,
  FileDownloadLog,
} from '@/entities/file-download-log/model/types'
import type { ExportFileDownloadsParams } from '@/shared/api/generated/logs/schemas/exportFileDownloadsParams'
import type { FileDownloadLogItem } from '@/shared/api/generated/logs/schemas/fileDownloadLogItem'
import type { FileDownloadsParams } from '@/shared/api/generated/logs/schemas/fileDownloadsParams'
import type { PageResponseFileDownloadLogItem } from '@/shared/api/generated/logs/schemas/pageResponseFileDownloadLogItem'

export const LIST_PAGE_SIZE = 20

export function toFileDownloadsParams(filter: FileDownloadListFilter): FileDownloadsParams {
  const params: FileDownloadsParams = {
    page: 0,
    size: LIST_PAGE_SIZE,
  }
  const adminName = filter.userName?.trim()
  if (adminName) params.adminName = adminName
  const fileName = filter.fileName?.trim()
  if (fileName) params.fileName = fileName
  if (filter.from?.trim()) params.from = filter.from.trim()
  if (filter.to?.trim()) params.to = filter.to.trim()
  return params
}

export function toFileDownloadsExportParams(
  filter: FileDownloadListFilter,
): ExportFileDownloadsParams {
  const params: ExportFileDownloadsParams = {}
  const adminName = filter.userName?.trim()
  if (adminName) params.adminName = adminName
  const fileName = filter.fileName?.trim()
  if (fileName) params.fileName = fileName
  if (filter.from?.trim()) params.from = filter.from.trim()
  if (filter.to?.trim()) params.to = filter.to.trim()
  return params
}

function mapItem(row: FileDownloadLogItem): FileDownloadLog {
  return {
    id: String(row.id ?? ''),
    fileName: row.originalName ?? '',
    userName: row.adminName ?? '',
    downloadedAt: row.createdAt ?? '',
    ip: row.clientIp ?? '',
  }
}

export function mapFileDownloadsPageToDomain(
  response: PageResponseFileDownloadLogItem,
): FileDownloadListResult {
  const rows = (response.items ?? []).map(mapItem)
  return {
    rows,
    total: typeof response.totalCount === 'number' ? response.totalCount : rows.length,
  }
}
