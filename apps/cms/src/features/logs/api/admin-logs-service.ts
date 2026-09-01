import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { applyMemberLoginRetentionFromFilter } from '@/features/logs/lib/member-login-retention'
import {
  mapBugIssueLogListPageResponse,
  mapDownloadLogListPageResponse,
  mapMemberLoginLogListPageResponse,
  mapPersonalInfoAccessLogListPageResponse,
} from '@/features/logs/api/adapters/logs-adapters'
import {
  fetchFileAccessLogsRemote,
  fetchMemberLoginsRemote,
  fetchPrivacyAccessLogsRemote,
  fetchSystemIssueLogsRemote,
  toLogsListQueryParams,
} from '@/features/logs/api/logs-api-client'
import { LOG_LIST_PAGE_SIZE, type LogListPage } from '@/features/logs/api/log-list-page'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'
import type { BugIssueLog } from '@/types/bug-issue-log'
import type { DownloadLog } from '@/types/download-log'
import type { MemberLoginLog } from '@/types/member-login-log'
import type { PersonalInfoAccessLog } from '@/types/personal-info-access-log'

export function shouldUseLogsRemoteApi(): boolean {
  return isRealApiModuleEnabled('logs') && hasRemoteAdminJwt()
}

function assertLogsRemoteApiReady(): void {
  if (!isRealApiModuleEnabled('logs')) {
    throw new Error('로그 관리 API가 활성화되지 않았습니다. VITE_REAL_API_MODULES에 logs를 추가해 주세요.')
  }
  if (!hasRemoteAdminJwt()) {
    throw new Error('로그 조회는 관리자 로그인 후 이용할 수 있습니다.')
  }
}

export async function getFileDownloadLogsPage(
  filters: Record<string, string> = {},
  page = 0,
  size = LOG_LIST_PAGE_SIZE
): Promise<LogListPage<DownloadLog>> {
  assertLogsRemoteApiReady()
  const dto = await fetchFileAccessLogsRemote(toLogsListQueryParams(filters, page, size))
  return mapDownloadLogListPageResponse(dto)
}

export async function getPersonalInfoAccessLogsPage(
  filters: Record<string, string> = {},
  page = 0,
  size = LOG_LIST_PAGE_SIZE
): Promise<LogListPage<PersonalInfoAccessLog>> {
  assertLogsRemoteApiReady()
  const dto = await fetchPrivacyAccessLogsRemote(toLogsListQueryParams(filters, page, size))
  return mapPersonalInfoAccessLogListPageResponse(dto)
}

export async function getMemberLoginLogsPage(
  filters: Record<string, string> = {},
  page = 0,
  size = LOG_LIST_PAGE_SIZE
): Promise<LogListPage<MemberLoginLog>> {
  assertLogsRemoteApiReady()
  const dto = await fetchMemberLoginsRemote(
    toLogsListQueryParams(applyMemberLoginRetentionFromFilter(filters), page, size)
  )
  return mapMemberLoginLogListPageResponse(dto)
}

export async function getBugIssueLogsPage(
  filters: Record<string, string> = {},
  page = 0,
  size = LOG_LIST_PAGE_SIZE
): Promise<LogListPage<BugIssueLog>> {
  assertLogsRemoteApiReady()
  const dto = await fetchSystemIssueLogsRemote(toLogsListQueryParams(filters, page, size))
  return mapBugIssueLogListPageResponse(dto)
}

export function getLogsApiErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosErr = error as { response?: { status?: number; data?: unknown } }
    if (axiosErr.response?.status === 403) {
      return '로그 조회 권한이 없습니다. MASTER 관리자 계정으로 다시 로그인해 주세요.'
    }
    const data = axiosErr.response?.data
    if (data && typeof data === 'object') {
      const o = data as Record<string, unknown>
      const wrapped = o.error as { message?: string } | undefined
      if (wrapped?.message) return wrapped.message
      if (typeof o.message === 'string') return o.message
    }
  }
  if (error instanceof Error && error.message) return error.message
  return fallback
}
