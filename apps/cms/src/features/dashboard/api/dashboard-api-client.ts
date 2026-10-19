/**
 * Orval 생성 함수 래퍼 — axios 응답 body 추출
 * UI·페이지에서 직접 import하지 말고 admin-dashboard-service / dashboard-api-client만 사용.
 */
import { getJABackendAdminAPIDashboardSubset } from '@/shared/api/generated/dashboard/dashboard-api'
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
  Notifications1Params,
  NotificationPageResponse,
} from '@/features/dashboard/api/dashboard-generated-types'

const dashboardRemoteApi = getJABackendAdminAPIDashboardSubset()

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
  return unwrapBody(await dashboardRemoteApi.getApiAdminDashboardHome())
}

export async function fetchDashboardNotificationCountRemote(): Promise<NotificationUnreadCountResponse> {
  return unwrapBody(await dashboardRemoteApi.getApiAdminDashboardNotificationsCount())
}

export async function fetchDashboardRecruitmentsRemote(
  params: DashboardRecruitmentsParams | Record<string, string>
): Promise<DashboardRecruitmentListResponse> {
  return unwrapBody(
    await dashboardRemoteApi.getApiAdminDashboardRecruitments(params as DashboardRecruitmentsParams)
  )
}

export async function fetchDashboardKpiProgressRemote(
  params: DashboardKpiProgressParams | Record<string, string>
): Promise<DashboardKpiProgressListResponse> {
  return unwrapBody(
    await dashboardRemoteApi.getApiAdminDashboardKpiProgress(params as DashboardKpiProgressParams)
  )
}

export async function fetchDashboardProgramInquiriesRemote(
  params: DashboardProgramInquiriesParams | Record<string, string>
): Promise<DashboardProgramInquiryListResponse> {
  return unwrapBody(
    await dashboardRemoteApi.getApiAdminDashboardProgramInquiries(params as DashboardProgramInquiriesParams)
  )
}

export async function fetchDashboardProgramSchedulesRemote(
  params: DashboardProgramSchedulesParams | Record<string, string>
): Promise<DashboardProgramScheduleListResponse> {
  return unwrapBody(
    await dashboardRemoteApi.getApiAdminDashboardProgramSchedules(params as DashboardProgramSchedulesParams)
  )
}

export async function fetchDashboardPreferencesRemote(): Promise<DashboardPreferencesResponse> {
  return unwrapBody(await dashboardRemoteApi.getApiAdminDashboardPreferences())
}

export async function saveDashboardPreferencesRemote(
  body: DashboardPreferencesSaveRequest
): Promise<unknown> {
  return unwrapBody(await dashboardRemoteApi.putApiAdminDashboardPreferences(body))
}

export async function fetchDashboardShortcutsRemote(): Promise<DashboardShortcutListResponse> {
  return unwrapBody(await dashboardRemoteApi.getApiAdminDashboardShortcuts())
}

/** Swagger: GET /api/admin/me/dashboard-preferences */
export async function fetchMeDashboardPreferencesRemote(): Promise<DashboardMePreferencesResponse> {
  return unwrapBody(await dashboardRemoteApi.getApiAdminMeDashboardPreferences())
}

/** Swagger: PUT /api/admin/me/dashboard-preferences */
export async function saveMeDashboardPreferencesRemote(
  body: DashboardMePreferencesRequest
): Promise<DashboardMePreferencesResponse> {
  return unwrapBody(await dashboardRemoteApi.putApiAdminMeDashboardPreferences(body))
}

/** Swagger: GET /api/admin/me/dashboard-shortcut-badges */
export async function fetchDashboardShortcutBadgesRemote(): Promise<DashboardShortcutBadgesResponse> {
  return unwrapBody(await dashboardRemoteApi.getApiAdminMeDashboardShortcutBadges())
}

/** Swagger: POST /api/admin/me/dashboard-shortcut-badges/{shortcutId}/read */
export async function readDashboardShortcutBadgeRemote(
  shortcutId: string,
  body?: DashboardShortcutBadgeReadRequest
): Promise<DashboardShortcutBadgeReadResponse> {
  return unwrapBody(
    await dashboardRemoteApi.postApiAdminMeDashboardShortcutBadgesShortcutIdRead(shortcutId, body ?? {})
  )
}

/** Swagger: GET /api/admin/notifications */
export async function fetchAdminNotificationsRemote(
  params?: Notifications1Params
): Promise<NotificationPageResponse> {
  return unwrapBody(await dashboardRemoteApi.getApiAdminNotifications(params))
}

function parseNotificationRecipientId(recipientId: string | number): number {
  const id = typeof recipientId === 'number' ? recipientId : Number(recipientId)
  if (!Number.isFinite(id)) {
    throw new Error('알림 recipientId가 올바르지 않습니다.')
  }
  return id
}

/** Swagger: PATCH /api/admin/notifications/{recipientId}/read */
export async function markAdminNotificationReadRemote(recipientId: string | number): Promise<void> {
  await dashboardRemoteApi.patchApiAdminNotificationsRecipientIdRead(parseNotificationRecipientId(recipientId))
}

/** Swagger: PATCH /api/admin/notifications/read-all */
export async function markAllAdminNotificationsReadRemote(): Promise<NotificationReadAllResponse> {
  return unwrapBody(await dashboardRemoteApi.patchApiAdminNotificationsReadAll())
}

/** Swagger: PATCH /api/admin/notifications/{recipientId}/hidden */
export async function hideAdminNotificationRemote(recipientId: string | number): Promise<void> {
  await dashboardRemoteApi.patchApiAdminNotificationsRecipientIdHidden(parseNotificationRecipientId(recipientId))
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
