/**
 * 파일 다운로드 이력 — OpenAPI ↔ 도메인 매핑
 */

import type {
  FileDownloadListFilter,
  FileDownloadListResult,
  FileDownloadLog,
} from '@/entities/file-download-log/model/types'
import { LOG_LIST_PAGE_SIZE } from '@/features/logs/shared/lib/list-page'
import type { ExportFileDownloadsParams } from '@/shared/api/generated/logs/schemas/exportFileDownloadsParams'
import type { FileDownloadLogItem } from '@/shared/api/generated/logs/schemas/fileDownloadLogItem'
import type { FileDownloadsParams } from '@/shared/api/generated/logs/schemas/fileDownloadsParams'
import { formatContainedPiiLead, parseContainedPiiTypes } from '@jakorea/domain/shared/file-download-password'
import type { PageResponseFileDownloadLogItem } from '@/shared/api/generated/logs/schemas/pageResponseFileDownloadLogItem'
import { localizeServerExportFileName } from './export-file-name'

export const LIST_PAGE_SIZE = LOG_LIST_PAGE_SIZE

export function toFileDownloadsParams(filter: FileDownloadListFilter): FileDownloadsParams {
  const params: FileDownloadsParams = {
    page: filter.page ?? 0,
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
  const extra = row as FileDownloadLogItem & {
    downloadKind?: string
    kind?: string
    containedPiiTypes?: unknown
  }
  return {
    id: String(row.id ?? ''),
    fileName: localizeServerExportFileName(row.originalName ?? ''),
    userName: row.adminName ?? '',
    downloadedAt: row.createdAt ?? '',
    ip: row.clientIp ?? '',
    downloadKind: extra.downloadKind?.trim() || extra.kind?.trim() || row.sourceType || '',
    containedPiiLabel: formatContainedPiiLead(parseContainedPiiTypes(extra.containedPiiTypes)),
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
