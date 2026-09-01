/**
 * 관리자 계정 처리 이력 — OpenAPI ↔ 도메인 매핑
 */

import type {
  AdminAccountActionType,
  AdminAccountListFilter,
  AdminAccountListResult,
  AdminAccountLog,
} from '@/entities/admin-account-log/model/types'
import { ADMIN_ACCOUNT_ACTION_TYPES } from '@/entities/admin-account-log/model/types'
import type { AdminAccountActionLogItem } from '@/shared/api/generated/logs/schemas/adminAccountActionLogItem'
import type { AdminAccountActionsParams } from '@/shared/api/generated/logs/schemas/adminAccountActionsParams'
import type { ExportAdminAccountActionsParams } from '@/shared/api/generated/logs/schemas/exportAdminAccountActionsParams'
import type { PageResponseAdminAccountActionLogItem } from '@/shared/api/generated/logs/schemas/pageResponseAdminAccountActionLogItem'

export const LIST_PAGE_SIZE = 20

function parseActionType(raw: string | undefined): AdminAccountActionType {
  if (raw && (ADMIN_ACCOUNT_ACTION_TYPES as readonly string[]).includes(raw)) {
    return raw as AdminAccountActionType
  }
  return 'profile_update'
}

export function toAdminAccountActionsParams(
  filter: AdminAccountListFilter,
): AdminAccountActionsParams {
  const params: AdminAccountActionsParams = {
    page: 0,
    size: LIST_PAGE_SIZE,
  }
  const name = filter.name?.trim()
  if (name) params.name = name
  const loginId = filter.loginId?.trim()
  if (loginId) params.loginId = loginId
  if (filter.actionType) params.actionType = filter.actionType
  if (filter.from?.trim()) params.from = filter.from.trim()
  if (filter.to?.trim()) params.to = filter.to.trim()
  return params
}

export function toAdminAccountActionsExportParams(
  filter: AdminAccountListFilter,
): ExportAdminAccountActionsParams {
  const params: ExportAdminAccountActionsParams = {}
  const name = filter.name?.trim()
  if (name) params.name = name
  const loginId = filter.loginId?.trim()
  if (loginId) params.loginId = loginId
  if (filter.actionType) params.actionType = filter.actionType
  if (filter.from?.trim()) params.from = filter.from.trim()
  if (filter.to?.trim()) params.to = filter.to.trim()
  return params
}

function mapItem(row: AdminAccountActionLogItem): AdminAccountLog {
  return {
    id: String(row.id ?? ''),
    name: row.name ?? '',
    loginId: row.loginId ?? '',
    actionType: parseActionType(row.actionType),
    processedAt: row.processedAt ?? '',
    ip: row.ip ?? '',
  }
}

export function mapAdminAccountActionsPageToDomain(
  response: PageResponseAdminAccountActionLogItem,
): AdminAccountListResult {
  const rows = (response.items ?? []).map(mapItem)
  return {
    rows,
    total: typeof response.totalCount === 'number' ? response.totalCount : rows.length,
  }
}
