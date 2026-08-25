import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { dashboardQueryKeys } from '@/features/dashboard/api/dashboard-query-keys'
import {
  loadDashboardPreferences,
  saveDashboardPreferences,
} from '@/features/dashboard/api/dashboard-preferences-service'
import { useDashboardRemoteQueryEnabled } from '@/features/dashboard/hooks/use-dashboard-query-scope'
import type { DashboardMePreferencesRequest } from '@/shared/api/generated/dashboard/schemas/dashboardMePreferencesRequest'

export function useDashboardPreferences(enabled = true) {
  const remoteEnabled = useDashboardRemoteQueryEnabled(enabled)

  return useQuery({
    queryKey: dashboardQueryKeys.preferences('remote'),
    queryFn: () => loadDashboardPreferences(),
    enabled: remoteEnabled,
    staleTime: 60_000,
  })
}

export interface SaveDashboardPreferencesOptions {
  /** 바로가기 가시성 등 settings 변경 시에만 true. layout-only 저장은 false */
  invalidateShortcutBadges?: boolean
}

export function useSaveDashboardPreferences(
  options: SaveDashboardPreferencesOptions = {}
) {
  const invalidateShortcutBadges = options.invalidateShortcutBadges ?? true
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload?: DashboardMePreferencesRequest) => saveDashboardPreferences(payload),
    onSuccess: data => {
      if (data) {
        queryClient.setQueryData(dashboardQueryKeys.preferences('remote'), data)
      }
      if (invalidateShortcutBadges) {
        void queryClient.invalidateQueries({
          queryKey: dashboardQueryKeys.shortcutBadges('remote'),
        })
      }
    },
  })
}
