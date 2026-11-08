/**
 * Orval 생성 함수 래퍼 — axios 응답 body 추출
 * UI·페이지에서 직접 import하지 말고 admin-dashboard-service / dashboard-api-client만 사용.
 */
import { getJAKoreaCMSBackendAPIDashboardSubset } from '@/shared/api/generated/dashboard/dashboard-api'
import { unwrapDashboardBody } from '@/features/dashboard/api/unwrap-dashboard-body'
import type { DashboardWidgetListResponse } from '@/shared/api/generated/dashboard/schemas/dashboardWidgetListResponse'
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

const dashboardRemoteApi = getJAKoreaCMSBackendAPIDashboardSubset()

export { unwrapDashboardBody } from '@/features/dashboard/api/unwrap-dashboard-body'

export async function fetchDashboardHomeRemote(): Promise<DashboardHomeResponse> {
  return unwrapDashboardBody(await dashboardRemoteApi.dashboardHome())
}

export async function fetchDashboardWidgetsRemote(): Promise<DashboardWidgetListResponse> {
  const dto = unwrapDashboardBody<DashboardWidgetListResponse>(
    await dashboardRemoteApi.dashboardWidgets()
  )
  return { items: dto.items ?? [] }
}

/** Swagger: GET /api/admin/notifications/unread-count — 인박스 목록과 동일 SSOT */
export async function fetchDashboardNotificationCountRemote(): Promise<NotificationUnreadCountResponse> {
  return unwrapDashboardBody(await dashboardRemoteApi.unreadNotificationCount())
}

export async function fetchDashboardRecruitmentsRemote(
  params: DashboardRecruitmentsParams | Record<string, string>
): Promise<DashboardRecruitmentListResponse> {
  const dto = unwrapDashboardBody<DashboardRecruitmentListResponse>(
    await dashboardRemoteApi.dashboardRecruitments(params as DashboardRecruitmentsParams)
  )
  return { ...dto, items: dto.items ?? [] }
}

export async function fetchDashboardKpiProgressRemote(
  params: DashboardKpiProgressParams | Record<string, string>
): Promise<DashboardKpiProgressListResponse> {
  return unwrapDashboardBody(
    await dashboardRemoteApi.dashboardKpiProgress(params as DashboardKpiProgressParams)
  )
}

export async function fetchDashboardProgramInquiriesRemote(
  params: DashboardProgramInquiriesParams | Record<string, string>
): Promise<DashboardProgramInquiryListResponse> {
  const dto = unwrapDashboardBody<DashboardProgramInquiryListResponse>(
    await dashboardRemoteApi.dashboardProgramInquiries(params as DashboardProgramInquiriesParams)
  )
  return {
    ...dto,
    items: dto.items ?? [],
    summaries: dto.summaries ?? [],
  }
}

export async function fetchDashboardProgramSchedulesRemote(
  params: DashboardProgramSchedulesParams | Record<string, string>
): Promise<DashboardProgramScheduleListResponse> {
  return unwrapDashboardBody(
    await dashboardRemoteApi.dashboardProgramSchedules(params as DashboardProgramSchedulesParams)
  )
}

export async function fetchDashboardPreferencesRemote(): Promise<DashboardPreferencesResponse> {
  return unwrapDashboardBody(await dashboardRemoteApi.dashboardPreferences())
}

export async function saveDashboardPreferencesRemote(
  body: DashboardPreferencesSaveRequest
): Promise<unknown> {
  return unwrapDashboardBody(await dashboardRemoteApi.saveDashboardPreferences1(body))
}

export async function fetchDashboardShortcutsRemote(): Promise<DashboardShortcutListResponse> {
  return unwrapDashboardBody(await dashboardRemoteApi.dashboardShortcuts())
}

/** Swagger: GET /api/admin/me/dashboard-preferences */
export async function fetchMeDashboardPreferencesRemote(): Promise<DashboardMePreferencesResponse> {
  return unwrapDashboardBody(await dashboardRemoteApi.getDashboardPreferences())
}

/** Swagger: PUT /api/admin/me/dashboard-preferences */
export async function saveMeDashboardPreferencesRemote(
  body: DashboardMePreferencesRequest
): Promise<DashboardMePreferencesResponse> {
  return unwrapDashboardBody(await dashboardRemoteApi.saveDashboardPreferences(body))
}

/** Swagger: GET /api/admin/me/dashboard-shortcut-badges */
export async function fetchDashboardShortcutBadgesRemote(): Promise<DashboardShortcutBadgesResponse> {
  return unwrapDashboardBody(await dashboardRemoteApi.getDashboardShortcutBadges())
}

/** Swagger: POST /api/admin/me/dashboard-shortcut-badges/{shortcutId}/read */
export async function readDashboardShortcutBadgeRemote(
  shortcutId: string,
  body?: DashboardShortcutBadgeReadRequest
): Promise<DashboardShortcutBadgeReadResponse> {
  return unwrapDashboardBody(
    await dashboardRemoteApi.readDashboardShortcutBadge(shortcutId, body ?? {})
  )
}

/** Swagger: GET /api/admin/notifications */
export async function fetchAdminNotificationsRemote(
  params?: Notifications1Params
): Promise<NotificationPageResponse> {
  return unwrapDashboardBody(await dashboardRemoteApi.notifications1(params))
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
  await dashboardRemoteApi.markRead2(parseNotificationRecipientId(recipientId))
}

/** Swagger: PATCH /api/admin/notifications/read-all */
export async function markAllAdminNotificationsReadRemote(): Promise<NotificationReadAllResponse> {
  return unwrapDashboardBody(await dashboardRemoteApi.readAllNotifications())
}

/** Swagger: PATCH /api/admin/notifications/{recipientId}/hidden */
export async function hideAdminNotificationRemote(recipientId: string | number): Promise<void> {
  await dashboardRemoteApi.hide1(parseNotificationRecipientId(recipientId))
}

/** 무필터 대시보드 목록 query. recruitments 카탈로그와 동일 키로 공유한다. */
export const EMPTY_DASHBOARD_QUERY_PARAMS: Record<string, string> = {}

/**
 * 필터용 programIds를 정렬·중복 제거한다.
 * 빈 배열/undefined는 전체 조회(파라미터 생략).
 */
export function normalizeDashboardProgramIds(
  programIds: string[] | undefined
): string[] | undefined {
  if (!programIds || programIds.length === 0) return undefined
  const unique = [...new Set(programIds.map(String))]
  unique.sort()
  return unique.length > 0 ? unique : undefined
}

/** 위젯 programIds 필터 → 대시보드 목록 query (flat). OpenAPI `params` 맵 래핑은 제거됨. */
export function toDashboardQueryParams(options?: {
  programIds?: string[]
  extra?: Record<string, string>
}): Record<string, string> {
  const params: Record<string, string> = { ...(options?.extra ?? {}) }
  const normalized = normalizeDashboardProgramIds(options?.programIds)
  if (normalized && normalized.length > 0) {
    params.programIds = normalized.join(',')
  }
  return params
}
