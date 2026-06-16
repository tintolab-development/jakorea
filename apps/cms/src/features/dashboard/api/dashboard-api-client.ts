/**
 * Orval 생성 함수 래퍼 — axios 응답 body 추출
 * UI·페이지에서 직접 import하지 말고 admin-dashboard-service / dashboard-api-client만 사용.
 */
import { getJAKoreaCMSBackendAPIDashboardSubset } from '@/shared/api/generated/dashboard/dashboard-api'
import type {
  DashboardHomeResponse,
  DashboardKpiProgressListResponse,
  DashboardLogAlertListResponse,
  DashboardPreferencesResponse,
  DashboardPreferencesSaveRequest,
  DashboardProgramInquiryListResponse,
  DashboardProgramScheduleListResponse,
  DashboardRecruitmentListResponse,
  DashboardShortcutListResponse,
  DashboardKpiProgressParams,
  DashboardProgramInquiriesParams,
  DashboardProgramSchedulesParams,
  DashboardRecruitmentsParams,
  NotificationUnreadCountResponse,
} from '@/shared/api/generated/dashboard/schemas'

const dashboardRemoteApi = getJAKoreaCMSBackendAPIDashboardSubset()

function unwrapBody<T>(payload: unknown): T {
  if (
    payload != null &&
    typeof payload === 'object' &&
    'data' in payload &&
    'status' in payload &&
    typeof (payload as { status: unknown }).status === 'number'
  ) {
    return (payload as { data: T }).data
  }
  return payload as T
}

export async function fetchDashboardHomeRemote(): Promise<DashboardHomeResponse> {
  return unwrapBody(await dashboardRemoteApi.dashboardHome())
}

export async function fetchDashboardNotificationCountRemote(): Promise<NotificationUnreadCountResponse> {
  return unwrapBody(await dashboardRemoteApi.dashboardNotificationCount())
}

export async function fetchDashboardRecruitmentsRemote(
  params: DashboardRecruitmentsParams
): Promise<DashboardRecruitmentListResponse> {
  return unwrapBody(await dashboardRemoteApi.dashboardRecruitments(params))
}

export async function fetchDashboardKpiProgressRemote(
  params: DashboardKpiProgressParams
): Promise<DashboardKpiProgressListResponse> {
  return unwrapBody(await dashboardRemoteApi.dashboardKpiProgress(params))
}

export async function fetchDashboardProgramInquiriesRemote(
  params: DashboardProgramInquiriesParams
): Promise<DashboardProgramInquiryListResponse> {
  return unwrapBody(await dashboardRemoteApi.dashboardProgramInquiries(params))
}

export async function fetchDashboardProgramSchedulesRemote(
  params: DashboardProgramSchedulesParams
): Promise<DashboardProgramScheduleListResponse> {
  return unwrapBody(await dashboardRemoteApi.dashboardProgramSchedules(params))
}

export async function fetchDashboardPreferencesRemote(): Promise<DashboardPreferencesResponse> {
  return unwrapBody(await dashboardRemoteApi.dashboardPreferences())
}

export async function saveDashboardPreferencesRemote(
  body: DashboardPreferencesSaveRequest
): Promise<DashboardPreferencesResponse> {
  return unwrapBody(await dashboardRemoteApi.saveDashboardPreferences(body))
}

export async function fetchDashboardShortcutsRemote(): Promise<DashboardShortcutListResponse> {
  return unwrapBody(await dashboardRemoteApi.dashboardShortcuts())
}

export async function fetchDashboardLogAlertsRemote(): Promise<DashboardLogAlertListResponse> {
  return unwrapBody(await dashboardRemoteApi.dashboardLogAlerts())
}

/** 위젯 programIds 필터 → 백엔드 params 맵 */
export function toDashboardQueryParams(options?: {
  programIds?: string[]
  extra?: Record<string, string>
}): Record<string, string> {
  const params: Record<string, string> = { ...(options?.extra ?? {}) }
  if (options?.programIds && options.programIds.length > 0) {
    params.programIds = options.programIds.join(',')
  }
  return params
}
