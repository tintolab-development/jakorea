import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  OrganizationChartInfo,
  OrganizationChartSaveInput,
} from '@/entities/organization-chart/model/types'
import { organizationChartQueryKeys } from './query-keys'
import {
  getOrganizationChartService,
  saveOrganizationChartService,
} from './service'

function cachedDetail(
  queryClient: ReturnType<typeof useQueryClient>,
): OrganizationChartInfo | undefined {
  return queryClient.getQueryData<OrganizationChartInfo>(
    organizationChartQueryKeys.detail(),
  )
}

export function useOrganizationChart(enabled = true) {
  return useQuery({
    queryKey: organizationChartQueryKeys.detail(),
    queryFn: () => getOrganizationChartService(),
    enabled,
    staleTime: 30_000,
    retry: 1,
  })
}

export function useSaveOrganizationChart() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: OrganizationChartSaveInput) =>
      saveOrganizationChartService(input, cachedDetail(queryClient)),
    retry: false,
    onSuccess: data => {
      // PUT 응답이 전체 문서(+version) — 추가 GET 없이 캐시 반영
      queryClient.setQueryData(organizationChartQueryKeys.detail(), data)
    },
  })
}
