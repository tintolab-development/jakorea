import type { MemberLoginListFilter, MemberLoginLog } from '@/entities/member-login-log/model/types'
import {
  displayLogField,
  downloadFilteredLogCsv,
  logExportDateTime,
} from '@/features/logs/shared/lib/export-log-list-csv'
import { getJAKoreaHomepageAdminAPILogsSubset } from '@/shared/api/generated/logs/logs-api'
import { toAdminListPage, type AdminListPage } from '@/shared/lib/admin-infinite-list'
import { mapMemberLoginsPageToDomain, toMemberLoginsParams } from './mappers'

function logsApi() {
  return getJAKoreaHomepageAdminAPILogsSubset()
}

export async function listMemberLoginLogsPageService(
  filter: MemberLoginListFilter,
  page: number,
): Promise<AdminListPage<MemberLoginLog>> {
  const response = await logsApi().memberLogins(toMemberLoginsParams({ ...filter, page }))
  const { rows, total } = mapMemberLoginsPageToDomain(response)
  return toAdminListPage(rows, page, {
    page: response.page,
    totalPages: response.totalPages,
    totalCount: total,
  })
}

export async function exportMemberLoginLogsService(
  filter: MemberLoginListFilter,
): Promise<'remote-downloaded'> {
  const nameHeader = filter.audience === 'user' ? '사용자명' : '관리자명'
  await downloadFilteredLogCsv({
    filenameBase: '회원_로그인_이력',
    headers: ['No.', nameHeader, '아이디', '로그인 일시', 'IP'],
    fetchPage: page => listMemberLoginLogsPageService(filter, page),
    toCells: row => [
      displayLogField(row.name),
      displayLogField(row.loginId),
      logExportDateTime(row.loggedAt),
      displayLogField(row.ip),
    ],
  })
  return 'remote-downloaded'
}
