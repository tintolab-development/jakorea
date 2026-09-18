/**
 * UJAT 기관 신청 상세 — 목록 캐시 + detail GET hydrate
 */

import { useMemo } from 'react'
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  approveOrganizationApplicationRemote,
  fetchOrganizationApplicationDetailRemote,
  rejectOrganizationApplicationRemote,
} from '@/features/program/general/api/applications-api-client'
import { enrichUjatInstitutionDetailFromRemote } from '@/features/program/ujat/api/applications-adapters'
import { listUjatInstitutionApplicationsPage } from '@/features/program/ujat/api/applications-service'
import { shouldUseUjatApplicationsRemoteApi } from '@/features/program/ujat/api/applications-remote-capabilities'
import { queryKeys as ujatQueryKeys } from '@/features/program/ujat/api/query-keys'
import { rejectUjatOrganizationApplicationsIfRemote } from '@/features/program/ujat/api/temporary-rejections'
import {
  getUjatInstitutionApplicationDetail,
} from '@/features/program/ujat/model/ujat-institution-application'
import type { UjatInstitutionApplicationRow } from '@/features/program/ujat/ui/detail-modal/application-institution/list/types'

export function useUjatInstitutionApplicationDetail(input: {
  institutionId: string
  programId?: string | null
}) {
  const { institutionId, programId } = input
  const remoteEnabled = shouldUseUjatApplicationsRemoteApi() && Boolean(programId)
  const queryClient = useQueryClient()

  const listQuery = useInfiniteQuery({
    queryKey: ujatQueryKeys.organizationApplications(programId ?? ''),
    queryFn: ({ pageParam }) => listUjatInstitutionApplicationsPage(String(programId), pageParam),
    initialPageParam: 0,
    getNextPageParam: lastPage => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
  })

  const rowFromList = useMemo((): UjatInstitutionApplicationRow | null => {
    const rows = listQuery.data?.pages.flatMap(page => page.rows) ?? []
    return rows.find(item => item.id === institutionId) ?? null
  }, [institutionId, listQuery.data])

  const detailQuery = useQuery({
    queryKey: [...ujatQueryKeys.applications(), 'organization-detail', institutionId] as const,
    queryFn: () => fetchOrganizationApplicationDetailRemote(institutionId),
    enabled: remoteEnabled && Boolean(institutionId),
    staleTime: 30_000,
    retry: false,
  })

  const row = rowFromList
  const detail = useMemo(() => {
    if (!row) return null
    if (detailQuery.data) return enrichUjatInstitutionDetailFromRemote(row, detailQuery.data)
    return getUjatInstitutionApplicationDetail(row)
  }, [detailQuery.data, row])

  const invalidate = async () => {
    if (!programId) return
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ujatQueryKeys.organizationApplications(programId),
      }),
      queryClient.invalidateQueries({
        queryKey: [...ujatQueryKeys.applications(), 'organization-detail', institutionId],
      }),
    ])
  }

  return {
    row,
    detail,
    loading: remoteEnabled && (listQuery.isLoading || detailQuery.isLoading) && !row,
    remoteEnabled,
    invalidate,
    approveRemote: async () => {
      await approveOrganizationApplicationRemote(institutionId)
      await invalidate()
    },
    rejectRemote: async (reason: string) => {
      await rejectOrganizationApplicationRemote(institutionId, { reason })
      await invalidate()
    },
    tempRejectRemote: async (reason: string) => {
      await rejectUjatOrganizationApplicationsIfRemote({
        programId,
        applicationIds: [institutionId],
        reason,
      })
      await invalidate()
    },
  }
}
