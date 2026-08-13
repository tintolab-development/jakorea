/**
 * 회원 로그인 이력 — OpenAPI ↔ 도메인 매핑
 */

import type {
  MemberLoginAudience,
  MemberLoginListFilter,
  MemberLoginListResult,
  MemberLoginLog,
} from '@/entities/member-login-log/model/types'
import type { ExportMemberLoginsParams } from '@/shared/api/generated/logs/schemas/exportMemberLoginsParams'
import type { MemberLoginLogItem } from '@/shared/api/generated/logs/schemas/memberLoginLogItem'
import type { MemberLoginsParams } from '@/shared/api/generated/logs/schemas/memberLoginsParams'
import type { PageResponseMemberLoginLogItem } from '@/shared/api/generated/logs/schemas/pageResponseMemberLoginLogItem'

export const LIST_PAGE_SIZE = 20

function toApiAudience(audience: MemberLoginAudience): string {
  return audience === 'user' ? 'USER' : 'ADMIN'
}

function fromApiAudience(raw: string | undefined): MemberLoginAudience {
  return raw?.toLowerCase() === 'user' ? 'user' : 'admin'
}

export function toMemberLoginsParams(filter: MemberLoginListFilter): MemberLoginsParams {
  const params: MemberLoginsParams = {
    audience: toApiAudience(filter.audience),
    page: 0,
    size: LIST_PAGE_SIZE,
  }
  const name = filter.name?.trim()
  if (name) params.name = name
  const loginId = filter.loginId?.trim()
  if (loginId) params.loginId = loginId
  if (filter.from?.trim()) params.from = filter.from.trim()
  if (filter.to?.trim()) params.to = filter.to.trim()
  return params
}

export function toMemberLoginsExportParams(
  filter: MemberLoginListFilter,
): ExportMemberLoginsParams {
  const params: ExportMemberLoginsParams = {
    audience: toApiAudience(filter.audience),
  }
  const name = filter.name?.trim()
  if (name) params.name = name
  const loginId = filter.loginId?.trim()
  if (loginId) params.loginId = loginId
  if (filter.from?.trim()) params.from = filter.from.trim()
  if (filter.to?.trim()) params.to = filter.to.trim()
  return params
}

function mapItem(row: MemberLoginLogItem): MemberLoginLog {
  return {
    id: String(row.id ?? ''),
    audience: fromApiAudience(row.audience),
    name: row.name ?? '',
    loginId: row.loginId ?? '',
    loggedAt: row.loggedAt ?? '',
    ip: row.ip ?? '',
  }
}

export function mapMemberLoginsPageToDomain(
  response: PageResponseMemberLoginLogItem,
): MemberLoginListResult {
  const rows = (response.items ?? []).map(mapItem)
  return {
    rows,
    total: typeof response.totalCount === 'number' ? response.totalCount : rows.length,
  }
}
