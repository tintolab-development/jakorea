/**
 * Orval 생성 함수 래퍼 — axios 응답 body 추출
 * UI·페이지에서 직접 import하지 말고 admin-logs-service만 사용.
 *
 * query는 최상위 키로 보냅니다 (`?page=0&size=20&adminName=…`).
 */
import { getJAKoreaCMSBackendAPILogsSubset } from '@/shared/api/generated/logs/logs-api'
import type {
  FileAccessLogsParams,
  LogListPageResponseBugIssueLogFrontendResponse,
  LogListPageResponseDownloadLogFrontendResponse,
  LogListPageResponseMemberLoginLogFrontendResponse,
  LogListPageResponsePersonalInfoAccessLogFrontendResponse,
  MemberLoginHistoryParams,
  PrivacyAccessLogsParams,
  SystemIssueLogsParams,
} from '@/shared/api/generated/logs/schemas'
import {
  LOG_LIST_PAGE_SIZE,
  clampLogListPageSize,
} from '@/features/logs/api/log-list-page'

const logsRemoteApi = getJAKoreaCMSBackendAPILogsSubset()

function unwrapBody<T>(payload: unknown): T {
  if (payload != null && typeof payload === 'object') {
    const o = payload as Record<string, unknown>
    if (o.success === true && 'data' in o) {
      return unwrapBody(o.data)
    }
    if (
      'data' in o &&
      'status' in o &&
      typeof (o as { status: unknown }).status === 'number'
    ) {
      return (o as { data: T }).data
    }
  }
  return payload as T
}

export function toLogsQueryParams(
  filters: Record<string, string | undefined>
): Record<string, string> {
  const params: Record<string, string> = {}
  for (const [key, value] of Object.entries(filters)) {
    if (key === 'page' || key === 'size') continue
    const trimmed = value?.trim()
    if (trimmed) params[key] = trimmed
  }
  return params
}

export function toLogsListQueryParams(
  filters: Record<string, string | undefined>,
  page = 0,
  size = LOG_LIST_PAGE_SIZE
): Record<string, string> {
  const safePage = Number.isFinite(page) && page > 0 ? Math.trunc(page) : 0
  return {
    ...toLogsQueryParams(filters),
    page: String(safePage),
    size: String(clampLogListPageSize(size)),
  }
}

function toOrvalListParams<T>(filters: Record<string, string>): T {
  return { ...filters } as unknown as T
}

export async function fetchFileAccessLogsRemote(
  params: Record<string, string>
): Promise<LogListPageResponseDownloadLogFrontendResponse> {
  return unwrapBody(
    await logsRemoteApi.fileAccessLogs(toOrvalListParams<FileAccessLogsParams>(params))
  )
}

export async function fetchPrivacyAccessLogsRemote(
  params: Record<string, string>
): Promise<LogListPageResponsePersonalInfoAccessLogFrontendResponse> {
  return unwrapBody(
    await logsRemoteApi.privacyAccessLogs(toOrvalListParams<PrivacyAccessLogsParams>(params))
  )
}

export async function fetchMemberLoginsRemote(
  params: Record<string, string>
): Promise<LogListPageResponseMemberLoginLogFrontendResponse> {
  return unwrapBody(
    await logsRemoteApi.memberLoginHistory(toOrvalListParams<MemberLoginHistoryParams>(params))
  )
}

export async function fetchSystemIssueLogsRemote(
  params: Record<string, string>
): Promise<LogListPageResponseBugIssueLogFrontendResponse> {
  return unwrapBody(
    await logsRemoteApi.systemIssueLogs(toOrvalListParams<SystemIssueLogsParams>(params))
  )
}
