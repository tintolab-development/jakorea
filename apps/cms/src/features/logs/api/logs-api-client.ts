/**
 * Orval 생성 함수 래퍼 — axios 응답 body 추출
 * UI·페이지에서 직접 import하지 말고 admin-logs-service만 사용.
 */
import { getJAKoreaCMSBackendAPILogsSubset } from '@/shared/api/generated/logs/logs-api'
import type {
  BugIssueLogFrontendResponse,
  DownloadLogFrontendResponse,
  FileAccessLogsParams,
  PersonalInfoAccessLogFrontendResponse,
  PrivacyAccessLogsParams,
  SystemIssueDetailResponse,
  SystemIssueLogsParams,
  SystemIssueStatusUpdateRequest,
} from '@/shared/api/generated/logs/schemas'

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
    const trimmed = value?.trim()
    if (trimmed) params[key] = trimmed
  }
  return params
}

export async function fetchFileAccessLogsRemote(
  params: Record<string, string>
): Promise<DownloadLogFrontendResponse[]> {
  const query: FileAccessLogsParams = { params }
  return unwrapBody(await logsRemoteApi.fileAccessLogs(query))
}

export async function fetchPrivacyAccessLogsRemote(
  params: Record<string, string>
): Promise<PersonalInfoAccessLogFrontendResponse[]> {
  const query: PrivacyAccessLogsParams = { params }
  return unwrapBody(await logsRemoteApi.privacyAccessLogs(query))
}

export async function fetchSystemIssueLogsRemote(
  params: Record<string, string>
): Promise<BugIssueLogFrontendResponse[]> {
  const query: SystemIssueLogsParams = { params }
  return unwrapBody(await logsRemoteApi.systemIssueLogs(query))
}

export async function fetchSystemIssueDetailRemote(
  issueId: number
): Promise<SystemIssueDetailResponse> {
  return unwrapBody(await logsRemoteApi.systemIssueDetail(issueId))
}

export async function patchSystemIssueStatusRemote(
  issueId: number,
  body: SystemIssueStatusUpdateRequest
): Promise<void> {
  await logsRemoteApi.updateSystemIssueStatus(issueId, body)
}
