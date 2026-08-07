import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { OrganizationChartSaveInput } from '@/entities/organization-chart/model/types'
import { shouldUseOrganizationChartRemoteApi } from './capabilities'
import { organizationChartQueryKeys } from './query-keys'
import {
  getOrganizationChartService,
  saveOrganizationChartService,
} from './service'

function source(): 'remote' | 'local' {
  return shouldUseOrganizationChartRemoteApi() ? 'remote' : 'local'
}

export function useOrganizationChart(enabled = true) {
  const dataSource = source()
  return useQuery({
    queryKey: organizationChartQueryKeys.detail(dataSource),
    queryFn: () => getOrganizationChartService(),
    enabled,
    staleTime: dataSource === 'remote' ? 30_000 : Number.POSITIVE_INFINITY,
    retry: dataSource === 'remote' ? 1 : false,
  })
}

export function useSaveOrganizationChart() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: OrganizationChartSaveInput) =>
      saveOrganizationChartService(input),
    retry: false,
    onSuccess: data => {
      queryClient.setQueryData(organizationChartQueryKeys.detail(source()), data)
      void queryClient.invalidateQueries({ queryKey: organizationChartQueryKeys.all })
    },
  })
}
