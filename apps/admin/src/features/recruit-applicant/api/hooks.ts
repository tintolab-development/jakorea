import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { RecruitApplicantListFilter } from '@/entities/recruit-applicant/model/types'
import { shouldUseRecruitApplicantRemoteApi } from './capabilities'
import { recruitApplicantQueryKeys } from './query-keys'
import {
  confirmRecruitApplicantsService,
  getRecruitApplicantService,
  listRecruitApplicantsService,
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
  const dataSource = source()
  return useQuery({
    queryKey: recruitApplicantQueryKeys.list(dataSource, filterKey(filter)),
    queryFn: () => listRecruitApplicantsService(filter),
    staleTime: dataSource === 'remote' ? 0 : Number.POSITIVE_INFINITY,
    gcTime: dataSource === 'remote' ? 0 : 15 * 60_000,
    retry: false,
  })
}

export function useRecruitApplicantDetail(id: string | null) {
  const dataSource = source()
  return useQuery({
    queryKey: recruitApplicantQueryKeys.detail(dataSource, id ?? ''),
    queryFn: () => getRecruitApplicantService(id ?? ''),
    enabled: Boolean(id),
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
