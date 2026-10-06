import { useLayoutEffect, useMemo } from 'react'
import {
  infiniteQueryOptions,
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query'
import type { Program } from '@/types/domain'
import { generalProgramQueryKeys } from '@/features/program/general/api/general-program-query-keys'
import { isProgramHardDeleteBlockedError } from '@/features/program/shared/lib/program-delete-guide'
import {
  programDetailCacheFromSave,
  syncOpenProgramDetailCache,
} from '@/features/program/shared/lib/program-detail-cache-after-save'
import { shouldUseCompanySchoolRemoteApi } from './capabilities'
import { shouldRetryCompanySchoolQuery } from './errors'
import type { CompanySchoolListFilters } from './list-params'
import { companySchoolQueryKeys } from './query-keys'
import { invalidateCompanySchoolListCaches } from '@/features/program/shared/lib/invalidate-program-list-caches-after-registration'
import {
  createCompanySchoolProgram,
  deleteCompanySchoolProgram,
  deleteCompanySchoolPrograms,
  fetchCompanySchoolOverviewStages,
  getCompanySchoolProgram,
  listCompanySchoolProgramsPage,
  updateCompanySchoolProgram,
  type CompanySchoolProgramsRemoteListPage,
} from './service'

/** 1사1교 목록 상단 4카드 건수 (목록과 동일 데이터 소스) */
export function useCompanySchoolOverviewStages(enabled = true) {
  const remoteEnabled = shouldUseCompanySchoolRemoteApi()
  return useQuery({
    queryKey: companySchoolQueryKeys.overviewStages(),
    queryFn: fetchCompanySchoolOverviewStages,
    enabled: enabled && remoteEnabled,
    staleTime: 30_000,
    retry: shouldRetryCompanySchoolQuery,
  })
}

function filtersKey(filters: CompanySchoolListFilters): string {
  return JSON.stringify({ source: 'remote', ...filters })
}

function keepFirstInfiniteQueryPage<T>(
  data: InfiniteData<T> | undefined
): InfiniteData<T> | undefined {
  if (!data || data.pages.length <= 1) return data
  return {
    ...data,
    pages: data.pages.slice(0, 1),
    pageParams: data.pageParams.slice(0, 1),
  }
}

/** 목록 첫 페이지 쿼리 옵션 — 목록 훅과 상단 위젯 hover 프리페치가 같은 키·캐시 정책을 공유 */
export function companySchoolProgramsInfiniteQueryOptions(filters: CompanySchoolListFilters) {
  return infiniteQueryOptions({
    queryKey: companySchoolQueryKeys.list(filtersKey(filters)),
    queryFn: ({ pageParam }) => listCompanySchoolProgramsPage(filters, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage: CompanySchoolProgramsRemoteListPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    staleTime: 30_000,
    retry: shouldRetryCompanySchoolQuery,
  })
}

export function useCompanySchoolPrograms(
  filters: CompanySchoolListFilters = {},
  enabled = true
) {
  const remoteEnabled = shouldUseCompanySchoolRemoteApi()
  const queryClient = useQueryClient()
  const key = filtersKey(filters)
  const listQueryKey = useMemo(() => companySchoolQueryKeys.list(key), [key])

  useLayoutEffect(() => {
    if (!remoteEnabled || !enabled) return
    queryClient.setQueryData<InfiniteData<CompanySchoolProgramsRemoteListPage>>(
      listQueryKey,
      keepFirstInfiniteQueryPage
    )
  }, [queryClient, remoteEnabled, enabled, listQueryKey])

  return useInfiniteQuery({
    ...companySchoolProgramsInfiniteQueryOptions(filters),
    enabled: enabled && remoteEnabled,
    // 상단 위젯 단계 이동 시 새 키 응답 전까지 이전 목록을 유지 (빈 표 → 스피너 → 표 깜빡임 방지)
    placeholderData: keepPreviousData,
  })
}

export function useCompanySchoolProgramDetail(
  programId: string | undefined,
  enabled = true
) {
  const remoteEnabled = shouldUseCompanySchoolRemoteApi()
  return useQuery({
    queryKey: companySchoolQueryKeys.detail(programId ?? ''),
    queryFn: () => getCompanySchoolProgram(programId!),
    enabled: enabled && remoteEnabled && Boolean(programId),
    staleTime: 30_000,
    retry: shouldRetryCompanySchoolQuery,
  })
}

export function useCreateCompanySchoolProgram() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: companySchoolQueryKeys.mutations.create(),
    mutationFn: (program: Program) => createCompanySchoolProgram(program),
    retry: false,
    onSuccess: program => {
      queryClient.setQueryData(companySchoolQueryKeys.detail(program.id), program)
      invalidateCompanySchoolListCaches(queryClient)
    },
  })
}

export function useUpdateCompanySchoolProgram() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: companySchoolQueryKeys.mutations.update(''),
    mutationFn: ({
      programId,
      program,
      patch,
    }: {
      programId: string
      program: Program
      patch?: Partial<Program>
    }) => updateCompanySchoolProgram(programId, program, patch),
    retry: false,
    onSuccess: async (program, variables) => {
      const detailKey = companySchoolQueryKeys.detail(variables.programId)
      await syncOpenProgramDetailCache(
        queryClient,
        detailKey,
        programDetailCacheFromSave(
          variables.programId,
          program,
          variables.program,
          variables.patch
        )
      )
      invalidateCompanySchoolListCaches(queryClient)
      void queryClient.invalidateQueries({
        queryKey: generalProgramQueryKeys.navigation(variables.programId),
      })
    },
  })
}

export function useDeleteCompanySchoolProgram() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: companySchoolQueryKeys.mutations.delete(''),
    mutationFn: deleteCompanySchoolProgram,
    retry: false,
    onSuccess: async (_data, programId) => {
      const detailKey = companySchoolQueryKeys.detail(programId)
      await queryClient.cancelQueries({ queryKey: detailKey })
      queryClient.removeQueries({ queryKey: detailKey })
      invalidateCompanySchoolListCaches(queryClient)
    },
  })
}

export function useDeleteCompanySchoolPrograms() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: [...companySchoolQueryKeys.all, 'mutation', 'bulk-delete'] as const,
    mutationFn: deleteCompanySchoolPrograms,
    retry: false,
    onSuccess: async (_data, programIds) => {
      for (const programId of programIds) {
        const detailKey = companySchoolQueryKeys.detail(programId)
        await queryClient.cancelQueries({ queryKey: detailKey })
        queryClient.removeQueries({ queryKey: detailKey })
      }
      invalidateCompanySchoolListCaches(queryClient)
    },
    onError: error => {
      if (!isProgramHardDeleteBlockedError(error) || error.successCount < 1) return
      invalidateCompanySchoolListCaches(queryClient)
    },
  })
}

