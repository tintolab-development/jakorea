import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { getAccessToken } from '@/shared/lib/auth-token'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { queryRetryDelay, shouldRetryQuery } from '@/shared/lib/query-retry'
import {
  downloadPersonalCertificate,
  fetchPersonalCertificateAvailability,
  issuePersonalCertificate,
} from './personal-certificate-client'
import {
  readPortalCertificateIssueId,
  type PortalCertificateIssueRequest,
} from './personal-certificate-types'

const AVAILABILITY_STALE_MS = 15_000
const AVAILABILITY_GC_MS = 5 * 60_000

export function usePersonalCertificateAvailabilityQuery(options: {
  programId: string | number | null | undefined
  enabled?: boolean
  certificateType?: string
}) {
  const programId =
    options.programId != null && String(options.programId).trim()
      ? String(options.programId).trim()
      : null
  const certificateType = options.certificateType?.trim() || 'AUTO'
  const enabled =
    options.enabled !== false &&
    isRemoteApiConfigured() &&
    Boolean(getAccessToken()) &&
    programId != null

  const query = useQuery({
    queryKey: platformQueryKeys.mypage.programApplications.certificateAvailability(
      programId ?? '0',
      certificateType,
    ),
    queryFn: ({ signal }) =>
      fetchPersonalCertificateAvailability(programId!, { certificateType, signal }),
    enabled,
    staleTime: AVAILABILITY_STALE_MS,
    gcTime: AVAILABILITY_GC_MS,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  })

  return {
    enabled,
    isLoading: enabled && query.isPending,
    isFetching: query.isFetching,
    isError: enabled && query.isError,
    error: query.error,
    availability: query.data ?? null,
    refetch: query.refetch,
  }
}

export function useIssuePersonalCertificateMutation(options?: {
  applicationType?: string | null
  applicationId?: string | null
}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: PortalCertificateIssueRequest) => issuePersonalCertificate(body),
    retry: false,
    onSuccess: async (response, variables) => {
      const programId = String(variables.programId)
      await queryClient.invalidateQueries({
        queryKey: platformQueryKeys.mypage.programApplications.certificateAvailability(
          programId,
          variables.certificateType?.trim() || 'AUTO',
        ),
      })
      if (options?.applicationType && options?.applicationId) {
        await queryClient.invalidateQueries({
          queryKey: platformQueryKeys.mypage.programApplications.detail(
            options.applicationType,
            options.applicationId,
          ),
        })
      }
      await queryClient.invalidateQueries({
        queryKey: platformQueryKeys.mypage.programApplications.listPrefix(),
      })
      return readPortalCertificateIssueId(response)
    },
  })
}

export function useDownloadPersonalCertificateMutation() {
  return useMutation({
    mutationFn: (certificateIssueId: number) => downloadPersonalCertificate(certificateIssueId),
    retry: false,
  })
}
