/**
 * 대시보드 개인화 설정 — GET/PUT /api/admin/me/dashboard-preferences (mock: zustand persist 유지)
 */
import {
  applyMeDashboardPreferencesResponse,
  buildMeDashboardPreferencesRequest,
  fingerprintMePreferencesClient,
  fingerprintMePreferencesRequest,
  setCachedMePreferencesRevision,
  shouldApplyPreferencesSaveToClient,
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
import { resolveAdminRoleCodeFromUser } from '@/shared/lib/admin-role-policy'
import type { UserRole } from '@/types/user'

function resolvePreferencesLayoutRole(): UserRole {
  const role = useAuthStore.getState().user?.role
  return role ?? 'ADMIN'
}

function resolvePreferencesRequestRole(layoutRole: UserRole): string {
  return resolveAdminRoleCodeFromUser(useAuthStore.getState().user) ?? layoutRole
}

export async function loadDashboardPreferences(): Promise<DashboardMePreferencesResponse | null> {
  if (!shouldUseDashboardRemoteApi()) {
    return null
  }
  const dto = await fetchMeDashboardPreferencesRemote()
  applyMeDashboardPreferencesResponse(dto, resolvePreferencesLayoutRole())
  return dto
}

type PreferencesSaveWaiter = {
  payload?: DashboardMePreferencesRequest
  resolve: (value: DashboardMePreferencesResponse | null) => void
  reject: (reason: unknown) => void
}

let preferencesSaveWaiters: PreferencesSaveWaiter[] = []
let preferencesSavePumpRunning = false

/**
 * PUT을 한 번에 하나만 보내고, 대기 중 요청은 최신 payload로 합친다.
 * 응답 시점에 로컬 스토어가 이미 더 새 값이면 layout/settings를 덮지 않고 revision만 반영한다.
 */
export async function saveDashboardPreferences(
  payload?: DashboardMePreferencesRequest
): Promise<DashboardMePreferencesResponse | null> {
  if (!shouldUseDashboardRemoteApi()) {
    return null
  }
  return new Promise((resolve, reject) => {
    preferencesSaveWaiters.push({ payload, resolve, reject })
    void pumpDashboardPreferencesSaves()
  })
}

async function pumpDashboardPreferencesSaves(): Promise<void> {
  if (preferencesSavePumpRunning) return
  preferencesSavePumpRunning = true
  try {
    while (preferencesSaveWaiters.length > 0) {
      const batch = preferencesSaveWaiters
      preferencesSaveWaiters = []
      const last = batch[batch.length - 1]
      try {
        const saved = await saveDashboardPreferencesOnce(last.payload)
        for (const waiter of batch) waiter.resolve(saved)
      } catch (error) {
        for (const waiter of batch) waiter.reject(error)
      }
    }
  } finally {
    preferencesSavePumpRunning = false
    if (preferencesSaveWaiters.length > 0) {
      void pumpDashboardPreferencesSaves()
    }
  }
}

async function saveDashboardPreferencesOnce(
  payload?: DashboardMePreferencesRequest
): Promise<DashboardMePreferencesResponse> {
  const layoutRole = resolvePreferencesLayoutRole()
  const requestRole = resolvePreferencesRequestRole(layoutRole)
  const body = {
    ...(payload ?? buildMeDashboardPreferencesRequest(layoutRole, requestRole)),
    role: requestRole,
  }
  const sentFingerprint = fingerprintMePreferencesRequest(body)
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
  const apply = shouldApplyPreferencesSaveToClient(
    sentFingerprint,
    fingerprintMePreferencesClient(layoutRole, requestRole)
  )
  applyMeDashboardPreferencesResponse(saved, layoutRole, {
    applyLayout: apply,
    applySettings: apply,
  })
  return saved
}
