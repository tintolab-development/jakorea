import { useAuthStore } from '@/features/auth/model/auth-store'
import { shouldUseDashboardRemoteApi } from '@/features/dashboard/api/admin-dashboard-service'
import type { DashboardQueryScope } from '@/features/dashboard/api/dashboard-query-keys'

export type { DashboardQueryScope }

/**
 * TanStack Query key 세그먼트 — mock↔JWT 전환 시 캐시 분리
 * auth token 구독으로 MFA 직후 리렌더 보장
 */
export function useDashboardQueryScope(): DashboardQueryScope {
  useAuthStore(s => s.token)
  return shouldUseDashboardRemoteApi() ? 'remote' : 'mock'
}

export function useDashboardRemoteQueryEnabled(baseEnabled = true): boolean {
  const scope = useDashboardQueryScope()
  return baseEnabled && scope === 'remote'
}
