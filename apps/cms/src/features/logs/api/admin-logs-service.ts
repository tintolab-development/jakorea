import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { applyMemberLoginRetentionFromFilter } from '@/features/logs/lib/member-login-retention'
import {
  mapBugIssueLogListPageResponse,
  mapDownloadLogListPageResponse,
  mapMemberLoginLogListPageResponse,
  mapPersonalInfoAccessLogListPageResponse,
  mapSystemIssueDetailResponse,
} from '@/features/logs/api/adapters/logs-adapters'
import {
  exportMemberLoginHistoryRemote,
  exportPrivacyAccessLogsRemote,
  exportSystemIssueLogsRemote,
  fetchFileAccessLogsRemote,
  fetchMemberLoginsRemote,
  fetchPrivacyAccessLogsRemote,
  fetchSystemIssueDetailRemote,
  fetchSystemIssueLogsRemote,
  toLogsListQueryParams,
} from '@/features/logs/api/logs-api-client'
import { downloadBlob } from '@/shared/utils/file-download'
import { buildBugIssueHistoryExcelFilename } from '@/features/logs/lib/bug-issue-excel'
import { buildMemberLoginHistoryExcelFilename } from '@/features/logs/lib/member-login-excel'
import { buildPersonalInfoAccessHistoryExcelFilename } from '@/features/logs/lib/personal-info-access-excel'
import { LOG_LIST_PAGE_SIZE, type LogListPage } from '@/features/logs/api/log-list-page'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'
import type { BugIssueLog, BugIssueLogDetail } from '@/types/bug-issue-log'
import type { DownloadLog } from '@/types/download-log'
import type { MemberLoginLog } from '@/types/member-login-log'
import type { PersonalInfoAccessLog } from '@/types/personal-info-access-log'

export function shouldUseLogsRemoteApi(): boolean {
  return isRealApiModuleEnabled('logs') && hasRemoteAdminJwt()
}

function assertLogsRemoteApiReady(): void {
  if (!isRealApiModuleEnabled('logs')) {
    throw new Error('로그 관리 API가 활성화되지 않았습니다. VITE_API_SERVER(또는 VITE_API_BASE_URL)로 백엔드를 설정해 주세요.')
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

export async function exportPersonalInfoAccessLogs(
  filters: Record<string, string> = {}
): Promise<void> {
  assertLogsRemoteApiReady()
  const blob = await exportPrivacyAccessLogsRemote(filters)
  if (blob.type.includes('json')) {
    const text = await blob.text()
    try {
      const parsed = JSON.parse(text) as { message?: string; error?: { message?: string } }
      throw new Error(
        parsed.error?.message ?? parsed.message ?? '개인정보 조회 이력 다운로드에 실패했습니다.'
      )
    } catch (error) {
      if (error instanceof Error && error.message !== 'Unexpected end of JSON input') {
        throw error
      }
      throw new Error('개인정보 조회 이력 다운로드에 실패했습니다.')
    }
  }
  // 서버 export가 file-access 이력을 남긴다 — client 로그 중복 방지
  await downloadBlob(blob, `${buildPersonalInfoAccessHistoryExcelFilename()}.xlsx`, {
    skipAccessLog: true,
  })
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

export async function exportMemberLoginLogs(
  filters: Record<string, string> = {}
): Promise<void> {
  assertLogsRemoteApiReady()
  const blob = await exportMemberLoginHistoryRemote(applyMemberLoginRetentionFromFilter(filters))
  if (blob.type.includes('json')) {
    const text = await blob.text()
    try {
      const parsed = JSON.parse(text) as { message?: string; error?: { message?: string } }
      throw new Error(parsed.error?.message ?? parsed.message ?? '관리자 로그인 이력 다운로드에 실패했습니다.')
    } catch (error) {
      if (error instanceof Error && error.message !== 'Unexpected end of JSON input') {
        throw error
      }
      throw new Error('관리자 로그인 이력 다운로드에 실패했습니다.')
    }
  }
  // 서버 export가 file-access 이력을 남긴다 — client 로그 중복 방지
  await downloadBlob(blob, `${buildMemberLoginHistoryExcelFilename()}.xlsx`, {
    skipAccessLog: true,
  })
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

export async function getBugIssueLogDetail(issueId: string): Promise<BugIssueLogDetail> {
  assertLogsRemoteApiReady()
  const numericId = Number(issueId)
  if (!Number.isFinite(numericId)) {
    throw new Error('버그/이슈 상세 ID가 유효하지 않습니다.')
  }
  const dto = await fetchSystemIssueDetailRemote(numericId)
  return mapSystemIssueDetailResponse(dto)
}

export async function exportBugIssueLogs(
  filters: Record<string, string> = {}
): Promise<void> {
  assertLogsRemoteApiReady()
  const blob = await exportSystemIssueLogsRemote(filters)
  if (blob.type.includes('json')) {
    const text = await blob.text()
    try {
      const parsed = JSON.parse(text) as { message?: string; error?: { message?: string } }
      throw new Error(
        parsed.error?.message ?? parsed.message ?? '버그/이슈 이력 다운로드에 실패했습니다.'
      )
    } catch (error) {
      if (error instanceof Error && error.message !== 'Unexpected end of JSON input') {
        throw error
      }
      throw new Error('버그/이슈 이력 다운로드에 실패했습니다.')
    }
  }
  // 서버 export가 file-access 이력을 남긴다 — client 로그 중복 방지
  await downloadBlob(blob, `${buildBugIssueHistoryExcelFilename()}.xlsx`, {
    skipAccessLog: true,
  })
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
