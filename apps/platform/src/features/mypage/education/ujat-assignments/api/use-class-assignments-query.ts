import { useMemo } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import type { ProgramApplicationType } from '../../applications/api/types'
import { getAccessToken, isRemoteApiConfigured } from '@/shared/lib'
import { queryRetryDelay, shouldRetryQuery } from '@/shared/lib/query-retry'
import { platformQueryKeys } from '@/shared/api/query-keys'
import {
  downloadUjatClassAssignmentConsentDocuments,
  fetchUjatClassAssignments,
} from './client'
import { mapPortalUjatClassAssignments } from './mappers'

const STALE_MS = 30_000
const GC_MS = 10 * 60_000

export function useUjatClassAssignmentsQuery(
  applicationType: ProgramApplicationType | null | undefined,
  applicationId: string | null | undefined,
) {
  const enabled = Boolean(
    isRemoteApiConfigured() && getAccessToken() && applicationType && applicationId,
  )

  const query = useQuery({
    queryKey: platformQueryKeys.mypage.programApplications.classAssignments(
      applicationType ?? '',
      applicationId ?? '',
    ),
    queryFn: ({ signal }) => fetchUjatClassAssignments(applicationType!, applicationId!, signal),
    enabled,
    staleTime: STALE_MS,
    gcTime: GC_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  })

  const sections = useMemo(
    () => mapPortalUjatClassAssignments(query.data),
    [query.data],
  )

  return {
    enabled,
    isLoading: enabled && query.isPending,
    isError: enabled && query.isError,
    sections,
    refetch: query.refetch,
  }
}

export function useDownloadUjatClassAssignmentConsentDocuments() {
  return useMutation({
    mutationFn: (downloadPath: string) =>
      downloadUjatClassAssignmentConsentDocuments(downloadPath),
    retry: false,
  })
}
