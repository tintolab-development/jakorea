/**
 * Orval 생성 함수 래퍼 — axios 응답 body 추출
 * UI·페이지에서 직접 import하지 말고 admin-dashboard-service / dashboard-api-client만 사용.
 */
import { getJAKoreaCMSBackendAPIDashboardSubset } from '@/shared/api/generated/dashboard/dashboard-api'
import type {
  DashboardHomeResponse,
  DashboardKpiProgressListResponse,
  DashboardMePreferencesRequest,
  DashboardMePreferencesResponse,
  DashboardPreferencesResponse,
  DashboardPreferencesSaveRequest,
  DashboardProgramInquiryListResponse,
  DashboardProgramScheduleListResponse,
  DashboardRecruitmentListResponse,
  DashboardShortcutBadgeReadRequest,
  DashboardShortcutBadgeReadResponse,
  DashboardShortcutBadgesResponse,
  DashboardShortcutListResponse,
  DashboardKpiProgressParams,
  DashboardProgramInquiriesParams,
  DashboardProgramSchedulesParams,
  DashboardRecruitmentsParams,
  NotificationReadAllResponse,
  NotificationUnreadCountResponse,
  NotificationsParams,
  PageResponse,
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
  return unwrapBody(await dashboardRemoteApi.saveDashboardPreferences1(body))
}

export async function fetchDashboardShortcutsRemote(): Promise<DashboardShortcutListResponse> {
  return unwrapBody(await dashboardRemoteApi.dashboardShortcuts())
}

/** Swagger: GET /api/admin/me/dashboard-preferences */
export async function fetchMeDashboardPreferencesRemote(): Promise<DashboardMePreferencesResponse> {
  return unwrapBody(await dashboardRemoteApi.getDashboardPreferences())
}

/** Swagger: PUT /api/admin/me/dashboard-preferences */
export async function saveMeDashboardPreferencesRemote(
  body: DashboardMePreferencesRequest
): Promise<DashboardMePreferencesResponse> {
  return unwrapBody(await dashboardRemoteApi.saveDashboardPreferences(body))
}

/** Swagger: GET /api/admin/me/dashboard-shortcut-badges */
export async function fetchDashboardShortcutBadgesRemote(): Promise<DashboardShortcutBadgesResponse> {
  return unwrapBody(await dashboardRemoteApi.getDashboardShortcutBadges())
}

/** Swagger: POST /api/admin/me/dashboard-shortcut-badges/{shortcutId}/read */
export async function readDashboardShortcutBadgeRemote(
  shortcutId: string,
  body?: DashboardShortcutBadgeReadRequest
): Promise<DashboardShortcutBadgeReadResponse> {
  return unwrapBody(await dashboardRemoteApi.readDashboardShortcutBadge(shortcutId, body ?? {}))
}

/** Swagger: GET /api/admin/notifications */
export async function fetchAdminNotificationsRemote(
  params?: NotificationsParams
): Promise<PageResponse> {
  return unwrapBody(await dashboardRemoteApi.notifications(params))
}

/** Swagger: PATCH /api/admin/notifications/{recipientId}/read */
export async function markAdminNotificationReadRemote(recipientId: string): Promise<void> {
  await dashboardRemoteApi.markRead1(Number(recipientId))
}

/** Swagger: PATCH /api/admin/notifications/read-all */
export async function markAllAdminNotificationsReadRemote(): Promise<NotificationReadAllResponse> {
  return unwrapBody(await dashboardRemoteApi.readAllNotifications())
}

/** Swagger: PATCH /api/admin/notifications/{recipientId}/hidden */
export async function hideAdminNotificationRemote(recipientId: string): Promise<void> {
  await dashboardRemoteApi.hide(Number(recipientId))
}

/** 위젯 programIds 필터 → 대시보드 목록 query (flat). OpenAPI `params` 맵 래핑은 제거됨. */
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
