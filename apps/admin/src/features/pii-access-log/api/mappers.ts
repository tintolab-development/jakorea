/**
 * 개인정보 조회 이력 — OpenAPI ↔ 도메인 매핑
 */

import type {
  PiiAccessListFilter,
  PiiAccessListResult,
  PiiAccessLog,
} from '@/entities/pii-access-log/model/types'
import type { ExportPrivacyAccessParams } from '@/shared/api/generated/logs/schemas/exportPrivacyAccessParams'
import type { PageResponsePrivacyAccessLogItem } from '@/shared/api/generated/logs/schemas/pageResponsePrivacyAccessLogItem'
import type { PrivacyAccessLogItem } from '@/shared/api/generated/logs/schemas/privacyAccessLogItem'
import type { PrivacyAccessParams } from '@/shared/api/generated/logs/schemas/privacyAccessParams'

export const LIST_PAGE_SIZE = 20

export function toPrivacyAccessParams(filter: PiiAccessListFilter): PrivacyAccessParams {
  const params: PrivacyAccessParams = {
    page: 0,
    size: LIST_PAGE_SIZE,
  }
  const targetName = filter.targetName?.trim()
  if (targetName) params.targetName = targetName
  const adminName = filter.accessorName?.trim()
  if (adminName) params.adminName = adminName
  const accessPurpose = filter.purpose?.trim()
  if (accessPurpose) params.accessPurpose = accessPurpose
  if (filter.from?.trim()) params.from = filter.from.trim()
  if (filter.to?.trim()) params.to = filter.to.trim()
  return params
}

export function toPrivacyAccessExportParams(
  filter: PiiAccessListFilter,
): ExportPrivacyAccessParams {
  const params: ExportPrivacyAccessParams = {}
  const targetName = filter.targetName?.trim()
  if (targetName) params.targetName = targetName
  const adminName = filter.accessorName?.trim()
  if (adminName) params.adminName = adminName
  const accessPurpose = filter.purpose?.trim()
  if (accessPurpose) params.accessPurpose = accessPurpose
  if (filter.from?.trim()) params.from = filter.from.trim()
  if (filter.to?.trim()) params.to = filter.to.trim()
  return params
}

function mapItem(row: PrivacyAccessLogItem): PiiAccessLog {
  return {
    id: String(row.id ?? ''),
    targetName: row.targetName ?? '',
    purpose: row.accessPurpose ?? '',
    accessorName: row.adminName ?? '',
    accessedAt: row.createdAt ?? '',
    ip: row.clientIp ?? '',
  }
}

export function mapPrivacyAccessPageToDomain(
  response: PageResponsePrivacyAccessLogItem,
): PiiAccessListResult {
  const rows = (response.items ?? []).map(mapItem)
  return {
    rows,
    total: typeof response.totalCount === 'number' ? response.totalCount : rows.length,
  }
}
