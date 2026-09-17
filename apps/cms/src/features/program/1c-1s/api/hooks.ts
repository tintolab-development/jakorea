import { useLayoutEffect, useMemo } from 'react'
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from '@tanstack/react-query'
import type { Program } from '@/types/domain'
import { generalProgramQueryKeys } from '@/features/program/general/api/general-program-query-keys'
import { shouldUseCompanySchoolRemoteApi } from './capabilities'
import { shouldRetryCompanySchoolQuery } from './errors'
import type { CompanySchoolListFilters } from './list-params'
import { companySchoolQueryKeys } from './query-keys'
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
    queryKey: listQueryKey,
    queryFn: ({ pageParam }) => listCompanySchoolProgramsPage(filters, pageParam as number),
    initialPageParam: 0,
    getNextPageParam: lastPage => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    enabled: enabled && remoteEnabled,
    staleTime: 30_000,
    retry: shouldRetryCompanySchoolQuery,
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
    mutationFn: createCompanySchoolProgram,
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
    onSuccess: program => {
      queryClient.setQueryData(companySchoolQueryKeys.detail(program.id), program)
      invalidateCompanySchoolListCaches(queryClient)
      void queryClient.invalidateQueries({
        queryKey: generalProgramQueryKeys.navigation(program.id),
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
    onSuccess: (_data, programId) => {
      queryClient.removeQueries({ queryKey: companySchoolQueryKeys.detail(programId) })
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
    onSuccess: (_data, programIds) => {
      for (const programId of programIds) {
        queryClient.removeQueries({ queryKey: companySchoolQueryKeys.detail(programId) })
      }
      invalidateCompanySchoolListCaches(queryClient)
    },
  })
}

function invalidateCompanySchoolListCaches(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: companySchoolQueryKeys.lists() })
  void queryClient.invalidateQueries({ queryKey: companySchoolQueryKeys.overviewStages() })
}
