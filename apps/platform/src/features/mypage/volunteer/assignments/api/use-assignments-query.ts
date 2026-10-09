import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { ProgramApplicationType } from '@/features/mypage/education/applications/api/types'
import { getAccessToken, isRemoteApiConfigured } from '@/shared/lib'
import { queryRetryDelay, shouldRetryQuery } from '@/shared/lib/query-retry'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { fetchVolunteerAssignments } from './client'
import { mapPortalVolunteerAssignments } from './mappers'

const STALE_MS = 30_000
const GC_MS = 10 * 60_000

type UseVolunteerAssignmentsQueryOptions = {
  applicationType: ProgramApplicationType | null | undefined
  applicationId: string | null | undefined
  programAudience: 'individual' | 'organization'
  lastParticipatedSession?: number
}

/** Class C + member scoped — GET .../assignments */
export function useVolunteerAssignmentsQuery({
  applicationType,
  applicationId,
  programAudience,
  lastParticipatedSession,
}: UseVolunteerAssignmentsQueryOptions) {
  const enabled = Boolean(
    isRemoteApiConfigured() && getAccessToken() && applicationType && applicationId,
  )

  const query = useQuery({
    queryKey: platformQueryKeys.mypage.programApplications.assignments(
      applicationType ?? '',
      applicationId ?? '',
    ),
    queryFn: ({ signal }) => fetchVolunteerAssignments(applicationType!, applicationId!, signal),
    enabled,
    staleTime: STALE_MS,
    gcTime: GC_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  })

  const bundle = useMemo(() => {
    if (!query.data) return null
    return mapPortalVolunteerAssignments(query.data, programAudience, lastParticipatedSession)
  }, [lastParticipatedSession, programAudience, query.data])

  return {
    enabled,
    isLoading: enabled && query.isPending,
    isError: enabled && query.isError,
    bundle,
  }
}
