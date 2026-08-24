import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { shouldUseGeminiVisitingTrainingRemoteApi } from './capabilities'
import { geminiVisitingTrainingQueryKeys } from './query-keys'
import {
  getGeminiRecruitmentDetail,
  listGeminiApprovedTrainings,
  listGeminiOrganizationApplications,
  listGeminiRecruitments,
} from './service'

export function useGeminiRecruitmentsQuery(enabled = true) {
  const remoteEnabled = shouldUseGeminiVisitingTrainingRemoteApi()
  return useQuery({
    queryKey: geminiVisitingTrainingQueryKeys.recruitmentList(),
    queryFn: () => listGeminiRecruitments(),
    enabled,
    staleTime: remoteEnabled ? 30_000 : Number.POSITIVE_INFINITY,
    retry: false,
  })
}

export function useGeminiRecruitmentDetailQuery(
  programId: string | undefined,
  enabled = true
) {
  return useQuery({
    queryKey: geminiVisitingTrainingQueryKeys.recruitmentDetail(programId ?? ''),
    queryFn: () => getGeminiRecruitmentDetail(programId!),
    enabled: enabled && Boolean(programId),
    staleTime: 30_000,
    retry: false,
  })
}

export function usePrefetchRecruitmentDetail() {
  const queryClient = useQueryClient()
  const remoteEnabled = shouldUseGeminiVisitingTrainingRemoteApi()

  return useCallback(
    (programId: string) => {
      if (!remoteEnabled || !programId) return
      void queryClient.prefetchQuery({
        queryKey: geminiVisitingTrainingQueryKeys.recruitmentDetail(programId),
        queryFn: () => getGeminiRecruitmentDetail(programId),
        staleTime: 30_000,
        retry: false,
      })
    },
    [queryClient, remoteEnabled]
  )
}

export function useGeminiOrganizationApplicationsQuery(
  programId: string | undefined,
  enabled = true
) {
  return useQuery({
    queryKey: geminiVisitingTrainingQueryKeys.organizationApplications(programId ?? ''),
    queryFn: () => listGeminiOrganizationApplications(programId!),
    enabled: enabled && Boolean(programId),
    staleTime: 30_000,
    retry: false,
  })
}

export function useGeminiApprovedTrainingsQuery(enabled = true) {
  const remoteEnabled = shouldUseGeminiVisitingTrainingRemoteApi()
  return useQuery({
    queryKey: geminiVisitingTrainingQueryKeys.approvedList(),
    queryFn: () => listGeminiApprovedTrainings(),
    enabled,
    staleTime: remoteEnabled ? 30_000 : Number.POSITIVE_INFINITY,
    retry: false,
  })
}
