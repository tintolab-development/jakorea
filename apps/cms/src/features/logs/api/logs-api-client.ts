/**
 * Orval 생성 함수 래퍼 — axios 응답 body 추출
 * UI·페이지에서 직접 import하지 말고 admin-logs-service만 사용.
 *
 * query는 최상위 키로 보냅니다 (`?page=0&size=20&adminName=…`).
 */
import { getJAKoreaCMSBackendAPILogsSubset } from '@/shared/api/generated/logs/logs-api'
import { customInstance } from '@/shared/api/orval-mutator'
import type {
  FileAccessLogsParams,
  LogListPageResponseBugIssueLogFrontendResponse,
  LogListPageResponseDownloadLogFrontendResponse,
  LogListPageResponseMemberLoginLogFrontendResponse,
  LogListPageResponsePersonalInfoAccessLogFrontendResponse,
  MemberLoginHistoryParams,
  PrivacyAccessLogsParams,
  SystemIssueDetailResponse,
  SystemIssueLogsParams,
} from '@/shared/api/generated/logs/schemas'
import {
  LOG_LIST_PAGE_SIZE,
  clampLogListPageSize,
} from '@/features/logs/api/log-list-page'

export {
  FILE_ACCESS_LOG_CREATE_PATH,
  postFileAccessLog as postFileAccessLogRemote,
  type PostFileAccessLogBody,
  type PostFileAccessLogResult,
} from '@/shared/lib/post-file-access-log'

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
  const out: Record<string, string | number> = { ...filters }
  if (filters.page != null) out.page = Number(filters.page)
  if (filters.size != null) out.size = Number(filters.size)
  return out as T
}

export async function fetchFileAccessLogsRemote(
  params: Record<string, string>
): Promise<LogListPageResponseDownloadLogFrontendResponse> {
  const call = logsRemoteApi.fileAccessLogs
  if (typeof call === 'function') {
    return unwrapBody(await call(toOrvalListParams<FileAccessLogsParams>(params)))
  }
  return unwrapBody(
    await customInstance({
      url: '/api/admin/logs/file-access',
      method: 'GET',
      params: toOrvalListParams<FileAccessLogsParams>(params),
    })
  )
}

/** 파일 다운로드 이력 — 조회 조건 전체 엑셀 (서버 생성, 다른 로그 export와 같은 방식) */
export async function exportFileAccessLogsRemote(
  filters: Record<string, string>
): Promise<Blob> {
  const query = toLogsQueryParams(filters)
  return customInstance<Blob>({
    url: '/api/admin/logs/file-access/export',
    method: 'GET',
    params: query,
    responseType: 'blob',
  })
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

export async function exportMemberLoginHistoryRemote(
  filters: Record<string, string>
): Promise<Blob> {
  const query = toLogsQueryParams(filters)
  return customInstance<Blob>({
    url: '/api/admin/logs/member-logins/export',
    method: 'GET',
    params: query,
    responseType: 'blob',
  })
}

export async function exportPrivacyAccessLogsRemote(
  filters: Record<string, string>
): Promise<Blob> {
  const query = toLogsQueryParams(filters)
  return customInstance<Blob>({
    url: '/api/admin/logs/privacy-access/export',
    method: 'GET',
    params: query,
    responseType: 'blob',
  })
}

export async function fetchSystemIssueLogsRemote(
  params: Record<string, string>
): Promise<LogListPageResponseBugIssueLogFrontendResponse> {
  return unwrapBody(
    await logsRemoteApi.systemIssueLogs(toOrvalListParams<SystemIssueLogsParams>(params))
  )
}

export async function fetchSystemIssueDetailRemote(
  issueId: number
): Promise<SystemIssueDetailResponse> {
  return unwrapBody(await logsRemoteApi.systemIssueDetail(issueId))
}

export async function exportSystemIssueLogsRemote(
  filters: Record<string, string>
): Promise<Blob> {
  const query = toLogsQueryParams(filters)
  return customInstance<Blob>({
    url: '/api/admin/logs/system-issues/export',
    method: 'GET',
    params: query,
    responseType: 'blob',
  })
}
