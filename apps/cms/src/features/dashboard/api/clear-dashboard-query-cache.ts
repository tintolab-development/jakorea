import { useDashboardSettingsStore } from '@/features/dashboard/model/dashboard-settings-store'
import { dashboardQueryKeys } from '@/features/dashboard/api/dashboard-query-keys'
import { queryClient } from '@/shared/lib/query-client'

/** 로그아웃·MFA 완료 등 인증 경계에서 mock/remote 캐시 교차 노출 방지 */
export function clearDashboardQueryCache(): void {
  useDashboardSettingsStore.getState().setAssignedProgramTypes(null)
  void queryClient.removeQueries({ queryKey: dashboardQueryKeys.all })
}
