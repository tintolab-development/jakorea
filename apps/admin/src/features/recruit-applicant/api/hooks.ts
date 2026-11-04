import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { RecruitApplicantListFilter } from '@/entities/recruit-applicant/model/types'
import { useAdminInfiniteList } from '@/shared/hooks/use-admin-infinite-list'
import { shouldUseRecruitApplicantRemoteApi } from './capabilities'
import { recruitApplicantQueryKeys } from './query-keys'
import {
  confirmRecruitApplicantsService,
  getRecruitApplicantService,
  listRecruitApplicantsPageService,
  removeRecruitApplicantsService,
  type RecruitApplicantConfirmInput,
} from './service'

function source(): 'remote' | 'local' {
  return shouldUseRecruitApplicantRemoteApi() ? 'remote' : 'local'
}

function filterKey(filter: RecruitApplicantListFilter): string {
  return JSON.stringify({
    s: filter.status ?? '',
    j: filter.jobInterest ?? '',
    n: filter.applicantName ?? '',
    p: filter.phone ?? '',
    e: filter.email ?? '',
    c: filter.careerType ?? '',
    af: filter.appliedFrom ?? '',
    at: filter.appliedTo ?? '',
    cf: filter.confirmedFrom ?? '',
    ct: filter.confirmedTo ?? '',
  })
}

export function useRecruitApplicantsList(filter: RecruitApplicantListFilter) {
  const remote = shouldUseRecruitApplicantRemoteApi()
  return useAdminInfiniteList({
    queryKey: recruitApplicantQueryKeys.list(source(), filterKey(filter)),
    isRemote: remote,
    fetchPage: page => listRecruitApplicantsPageService(filter, page),
    staleTime: remote ? 0 : Number.POSITIVE_INFINITY,
    gcTime: remote ? 0 : 15 * 60_000,
    retry: false,
  })
}

export function useRecruitApplicantDetail(
  id: string | null,
  options?: { revealPii?: boolean; enabled?: boolean },
) {
  const dataSource = source()
  const revealPii = options?.revealPii === true
  const extraEnabled = options?.enabled ?? true
  return useQuery({
    queryKey: recruitApplicantQueryKeys.detail(dataSource, id ?? '', revealPii),
    queryFn: () => getRecruitApplicantService(id ?? '', { revealPii }),
    enabled: Boolean(id) && extraEnabled,
    staleTime: dataSource === 'remote' ? 0 : Number.POSITIVE_INFINITY,
    gcTime: dataSource === 'remote' ? 0 : 15 * 60_000,
    retry: false,
  })
}

function invalidateApplicantQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: recruitApplicantQueryKeys.lists() })
  void queryClient.invalidateQueries({ queryKey: recruitApplicantQueryKeys.details() })
}

export function useConfirmRecruitApplicants() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (items: RecruitApplicantConfirmInput[]) => confirmRecruitApplicantsService(items),
    retry: false,
    onSuccess: () => {
      invalidateApplicantQueries(queryClient)
    },
  })
}

export function useRemoveRecruitApplicants() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => removeRecruitApplicantsService(ids),
    retry: false,
    onSuccess: () => {
      invalidateApplicantQueries(queryClient)
    },
  })
}
