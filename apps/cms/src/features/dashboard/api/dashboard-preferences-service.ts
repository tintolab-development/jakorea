/**
 * 대시보드 개인화 설정 — GET/PUT /api/admin/me/dashboard-preferences (mock: zustand persist 유지)
 */
import {
  applyMeDashboardPreferencesResponse,
  buildMeDashboardPreferencesRequest,
} from '@/features/dashboard/api/adapters/dashboard-me-preferences-adapters'
import {
  fetchMeDashboardPreferencesRemote,
  saveMeDashboardPreferencesRemote,
} from '@/features/dashboard/api/dashboard-api-client'
import { shouldUseDashboardRemoteApi } from '@/features/dashboard/api/admin-dashboard-service'
import type { DashboardMePreferencesRequest } from '@/shared/api/generated/dashboard/schemas/dashboardMePreferencesRequest'
import type { DashboardMePreferencesResponse } from '@/shared/api/generated/dashboard/schemas/dashboardMePreferencesResponse'
import { useAuthStore } from '@/features/auth/model/auth-store'
import type { UserRole } from '@/types/user'

function resolvePreferencesRole(): UserRole {
  const role = useAuthStore.getState().user?.role
  return role ?? 'ADMIN'
}

export async function loadDashboardPreferences(): Promise<DashboardMePreferencesResponse | null> {
  if (!shouldUseDashboardRemoteApi()) {
    return null
  }
  const dto = await fetchMeDashboardPreferencesRemote()
  applyMeDashboardPreferencesResponse(dto, resolvePreferencesRole())
  return dto
}

export async function saveDashboardPreferences(
  payload?: DashboardMePreferencesRequest
): Promise<DashboardMePreferencesResponse | null> {
  if (!shouldUseDashboardRemoteApi()) {
    return null
  }
  const body = payload ?? buildMeDashboardPreferencesRequest(resolvePreferencesRole())
  const saved = await saveMeDashboardPreferencesRemote(body)
  applyMeDashboardPreferencesResponse(saved, resolvePreferencesRole())
  return saved
}
