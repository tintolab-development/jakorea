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
    retry: 1,
  })
}

export function useSaveDashboardPreferences() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload?: DashboardMePreferencesRequest) => saveDashboardPreferences(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.preferences('remote') })
      void queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.all })
    },
  })
}
