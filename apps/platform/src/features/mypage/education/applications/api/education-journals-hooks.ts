import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { uploadMemberPortalFile } from '@/features/mypage/instructor-apply/api/member-file-upload'
import { getAccessToken } from '@/shared/lib/auth-token'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { queryRetryDelay, shouldRetryQuery } from '@/shared/lib/query-retry'
import { platformQueryKeys } from '@/shared/api/query-keys'
import {
  downloadPortalEducationJournal,
  fetchPortalEducationJournals,
  submitPortalEducationJournal,
  EDUCATION_JOURNAL_FILE_PURPOSE,
  type PortalEducationJournal,
} from './education-journals-client'

const STALE_MS = 30_000
const GC_MS = 10 * 60_000

function validScope(
  programId: string | null | undefined,
  organizationApplicationId: string | null | undefined,
): boolean {
  return Boolean(
    isRemoteApiConfigured() &&
      getAccessToken() &&
      programId &&
      organizationApplicationId &&
      Number(programId) > 0 &&
      Number(organizationApplicationId) > 0,
  )
}

function queryOptions() {
  return {
    staleTime: STALE_MS,
    gcTime: GC_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  } as const
}

export function usePortalEducationJournals(
  programId: string | null | undefined,
  organizationApplicationId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: platformQueryKeys.mypage.programApplications.educationJournals(
      programId ?? '',
      organizationApplicationId ?? '',
    ),
    queryFn: ({ signal }) =>
      fetchPortalEducationJournals(programId!, organizationApplicationId!, signal),
    enabled: enabled && validScope(programId, organizationApplicationId),
    ...queryOptions(),
  })
}

export function useSubmitPortalEducationJournal(
  programId: string | null | undefined,
  organizationApplicationId: string | null | undefined,
) {
  const queryClient = useQueryClient()
  return useMutation<PortalEducationJournal, Error, File>({
    mutationFn: async file => {
      if (!validScope(programId, organizationApplicationId)) {
        throw new Error('교육일지 제출 범위가 올바르지 않습니다.')
      }
      const fileObjectId = await uploadMemberPortalFile({
        file,
        filePurpose: EDUCATION_JOURNAL_FILE_PURPOSE,
      })
      return submitPortalEducationJournal({
        programId: programId!,
        organizationApplicationId: organizationApplicationId!,
        fileObjectId,
        journalTitle: file.name,
      })
    },
    retry: false,
    onSuccess: () => {
      if (!programId || !organizationApplicationId) return
      void queryClient.invalidateQueries({
        queryKey: platformQueryKeys.mypage.programApplications.educationJournals(
          programId,
          organizationApplicationId,
        ),
      })
    },
  })
}

export function useDownloadPortalEducationJournal() {
  return useMutation({
    mutationFn: (input: { fileObjectId: number; fileName: string }) =>
      downloadPortalEducationJournal(input),
    retry: false,
  })
}
