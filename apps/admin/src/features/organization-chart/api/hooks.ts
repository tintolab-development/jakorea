import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  OrganizationChartInfo,
  OrganizationChartSaveInput,
} from '@/entities/organization-chart/model/types'
import { shouldUseOrganizationChartRemoteApi } from './capabilities'
import { organizationChartQueryKeys } from './query-keys'
import {
  getOrganizationChartService,
  saveOrganizationChartService,
} from './service'

function source(): 'remote' | 'local' {
  return shouldUseOrganizationChartRemoteApi() ? 'remote' : 'local'
}

function cachedDetail(
  queryClient: ReturnType<typeof useQueryClient>,
): OrganizationChartInfo | undefined {
  return queryClient.getQueryData<OrganizationChartInfo>(
    organizationChartQueryKeys.detail(source()),
  )
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
      saveOrganizationChartService(input, cachedDetail(queryClient)),
    retry: false,
    onSuccess: data => {
      // PUT 응답이 전체 문서(+version) — 추가 GET 없이 캐시 반영
      queryClient.setQueryData(organizationChartQueryKeys.detail(source()), data)
    },
  })
}
