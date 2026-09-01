/**
 * 대시보드 개인화 설정 — GET/PUT /api/admin/me/dashboard-preferences (mock: zustand persist 유지)
 */
import {
  applyMeDashboardPreferencesResponse,
  buildMeDashboardPreferencesRequest,
  setCachedMePreferencesRevision,
} from '@/features/dashboard/api/adapters/dashboard-me-preferences-adapters'
import {
  fetchMeDashboardPreferencesRemote,
  saveMeDashboardPreferencesRemote,
} from '@/features/dashboard/api/dashboard-api-client'
import { shouldUseDashboardRemoteApi } from '@/features/dashboard/api/admin-dashboard-service'
import { runWithRevisionConflictRetry } from '@/features/dashboard/lib/revision-conflict-retry'
import { getQueryRetryHttpStatus } from '@/shared/lib/query-retry'
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
  const role = resolvePreferencesRole()
  const body = payload ?? buildMeDashboardPreferencesRequest(role)
  const saved = await runWithRevisionConflictRetry(
    body,
    saveMeDashboardPreferencesRemote,
    async () => {
      const latest = await fetchMeDashboardPreferencesRemote()
      setCachedMePreferencesRevision(latest.revision)
      return latest.revision
    },
    getQueryRetryHttpStatus
  )
  applyMeDashboardPreferencesResponse(saved, role)
  return saved
}
