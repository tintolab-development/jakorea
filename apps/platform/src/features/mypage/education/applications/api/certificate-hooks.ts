import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getAccessToken } from '@/shared/lib/auth-token'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { queryRetryDelay, shouldRetryQuery } from '@/shared/lib/query-retry'
import { platformQueryKeys } from '@/shared/api/query-keys'
import type { ProgramApplicationType } from './types.ts'
import {
  downloadMyCertificate,
  fetchMyCertificateAvailability,
  issueMyCertificate,
  PORTAL_CERTIFICATE_TYPE_COMPLETION,
} from './certificate-client.ts'
import type { PortalCertificateIssueRequest, PortalCertificateType } from './certificate-map.ts'

const STALE_MS = 30_000
const GC_MS = 10 * 60_000

function readProgramId(programId: string | number | null | undefined): number | null {
  const parsed = typeof programId === 'number' ? programId : Number(programId)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

export function useMyCertificateAvailabilityQuery(input: {
  programId?: string | number | null
  certificateType?: PortalCertificateType
  enabled?: boolean
}) {
  const programId = readProgramId(input.programId)
  const certificateType = input.certificateType ?? PORTAL_CERTIFICATE_TYPE_COMPLETION
  const enabled =
    Boolean(input.enabled) &&
    programId != null &&
    isRemoteApiConfigured() &&
    Boolean(getAccessToken())

  return useQuery({
    queryKey: platformQueryKeys.mypage.certificates.availability(programId ?? 0, certificateType),
    queryFn: ({ signal }) => fetchMyCertificateAvailability(programId as number, certificateType, signal),
    enabled,
    staleTime: STALE_MS,
    gcTime: GC_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  })
}

export function useIssueMyCertificateMutation(input: {
  applicationType?: ProgramApplicationType | null
  applicationId?: string | null
}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: PortalCertificateIssueRequest) => issueMyCertificate(request),
    retry: false,
    onSuccess: async (_result, request) => {
      const tasks = [
        queryClient.invalidateQueries({
          queryKey: platformQueryKeys.mypage.certificates.all(),
        }),
        queryClient.invalidateQueries({
          queryKey: [
            ...platformQueryKeys.mypage.programApplications.all(),
            'certificate-availability',
            String(request.programId),
          ],
        }),
        queryClient.invalidateQueries({
          queryKey: platformQueryKeys.mypage.programApplications.listPrefix(),
        }),
      ]
      if (input.applicationType && input.applicationId) {
        tasks.push(
          queryClient.invalidateQueries({
            queryKey: platformQueryKeys.mypage.programApplications.detail(
              input.applicationType,
              input.applicationId,
            ),
            exact: true,
          }),
        )
      }
      await Promise.all(tasks)
    },
  })
}

export function useDownloadMyCertificateMutation() {
  return useMutation({
    mutationFn: (input: { certificateIssueId: number; fileName: string }) =>
      downloadMyCertificate(input.certificateIssueId, { fileName: input.fileName }),
    retry: false,
  })
}
