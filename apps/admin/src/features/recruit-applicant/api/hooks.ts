import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { RecruitApplicantListFilter } from '@/entities/recruit-applicant/model/types'
import { fileDownloadLogQueryKeys } from '@/features/file-download-log/api/query-keys'
import { useAdminInfiniteList } from '@/shared/hooks/use-admin-infinite-list'
import { shouldUseRecruitApplicantRemoteApi } from './capabilities'
import { recruitApplicantQueryKeys } from './query-keys'
import {
  confirmRecruitApplicantsService,
  exportRecruitApplicantsService,
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

export function useRecruitApplicantDetail(id: string | null, enabled = true) {
  const dataSource = source()
  return useQuery({
    queryKey: recruitApplicantQueryKeys.detail(dataSource, id ?? ''),
    queryFn: () => getRecruitApplicantService(id ?? ''),
    enabled: Boolean(id) && enabled,
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
      // 목록만 갱신한다. 열린 상세 쿼리를 invalidate/remove하면 삭제된 id를 다시 조회해 404 →
      // "찾을 수 없음" 알림이 삭제 완료 안내를 덮는다. 상세 캐시는 모달이 닫히면 gcTime으로 정리된다.
      void queryClient.invalidateQueries({ queryKey: recruitApplicantQueryKeys.lists() })
    },
  })
}

/** 엑셀 다운로드 — 성공 시 BE가 남긴 파일 다운로드 이력 목록을 갱신한다. */
export function useExportRecruitApplicants() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (filter: RecruitApplicantListFilter) => exportRecruitApplicantsService(filter),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: fileDownloadLogQueryKeys.all })
    },
  })
}
