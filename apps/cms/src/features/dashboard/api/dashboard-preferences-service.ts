/**
 * 대시보드 개인화 설정 — GET/PUT preferences (mock: zustand persist 유지)
 */
import {
  applyDashboardPreferencesResponse,
  buildDashboardPreferencesSaveRequest,
} from '@/features/dashboard/api/adapters/dashboard-preferences-adapters'
import {
  fetchDashboardPreferencesRemote,
  saveDashboardPreferencesRemote,
} from '@/features/dashboard/api/dashboard-api-client'
import { shouldUseDashboardRemoteApi } from '@/features/dashboard/api/admin-dashboard-service'
import type { DashboardPreferencesResponse } from '@/shared/api/generated/dashboard/schemas/dashboardPreferencesResponse'
import type { DashboardPreferencesSaveRequest } from '@/shared/api/generated/dashboard/schemas/dashboardPreferencesSaveRequest'

export async function loadDashboardPreferences(): Promise<DashboardPreferencesResponse | null> {
  if (!shouldUseDashboardRemoteApi()) {
    return null
  }
  const dto = await fetchDashboardPreferencesRemote()
  applyDashboardPreferencesResponse(dto)
  return dto
}

export async function saveDashboardPreferences(
  payload?: DashboardPreferencesSaveRequest
): Promise<DashboardPreferencesResponse | null> {
  if (!shouldUseDashboardRemoteApi()) {
    return null
  }
  const body = payload ?? buildDashboardPreferencesSaveRequest()
  const saved = await saveDashboardPreferencesRemote(body)
  if (saved) {
    applyDashboardPreferencesResponse(saved)
  }
  return saved
}
