import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import {
  mapBugIssueLogListResponse,
  mapDownloadLogListResponse,
  mapPersonalInfoAccessLogListResponse,
  mapSystemIssueDetailResponse,
  type SystemIssueDetail,
} from '@/features/logs/api/adapters/logs-adapters'
import {
  fetchFileAccessLogsRemote,
  fetchPrivacyAccessLogsRemote,
  fetchSystemIssueDetailRemote,
  fetchSystemIssueLogsRemote,
  patchSystemIssueStatusRemote,
  toLogsQueryParams,
} from '@/features/logs/api/logs-api-client'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'
import type { BugIssueLog } from '@/types/bug-issue-log'
import type { DownloadLog } from '@/types/download-log'
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

export async function getFileDownloadLogsList(
  filters: Record<string, string> = {}
): Promise<DownloadLog[]> {
  assertLogsRemoteApiReady()
  const dto = await fetchFileAccessLogsRemote(toLogsQueryParams(filters))
  return mapDownloadLogListResponse(dto)
}

export async function getPersonalInfoAccessLogsList(
  filters: Record<string, string> = {}
): Promise<PersonalInfoAccessLog[]> {
  assertLogsRemoteApiReady()
  const dto = await fetchPrivacyAccessLogsRemote(toLogsQueryParams(filters))
  return mapPersonalInfoAccessLogListResponse(dto)
}

export async function getBugIssueLogsList(
  filters: Record<string, string> = {}
): Promise<BugIssueLog[]> {
  assertLogsRemoteApiReady()
  const dto = await fetchSystemIssueLogsRemote(toLogsQueryParams(filters))
  return mapBugIssueLogListResponse(dto)
}

export async function getSystemIssueDetail(issueId: number): Promise<SystemIssueDetail> {
  assertLogsRemoteApiReady()
  const dto = await fetchSystemIssueDetailRemote(issueId)
  return mapSystemIssueDetailResponse(dto)
}

export async function updateSystemIssueStatus(
  issueId: number,
  status: string
): Promise<void> {
  assertLogsRemoteApiReady()
  await patchSystemIssueStatusRemote(issueId, { status })
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
