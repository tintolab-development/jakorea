import { useLayoutEffect, useMemo } from 'react'
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query'
import type { Program } from '@/types/domain'
import { syncOpenProgramDetailCache } from '@/features/program/shared/lib/program-detail-cache-after-save'
import { invalidateUjatProgramListCaches } from '@/features/program/shared/lib/invalidate-program-list-caches-after-registration'
import { isProgramHardDeleteBlockedError } from '@/features/program/shared/lib/program-delete-guide'
import { fetchUjatProgramBusinessYears } from './business-years'
import { shouldUseRemoteApi } from './capabilities'
import { shouldRetryQuery } from './errors'
import type { ListParams } from './list-params'
import { queryKeys } from './query-keys'
import {
  create,
  detail,
  listPage,
  remove,
  removeMany,
  update,
  type CreateInput,
  type UjatProgramsRemoteListPage,
} from './service'

/** 진행년도는 프로그램 등록·삭제 때만 바뀐다. */
const UJAT_BUSINESS_YEARS_STALE_MS = 5 * 60 * 1000

function scope(): 'remote' | 'local' {
  return shouldUseRemoteApi() ? 'remote' : 'local'
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

function listParamsKey(params: ListParams): string {
  return JSON.stringify({
    keyword: params.keyword ?? null,
    businessYear: params.businessYear ?? null,
    ujatProgressStatus: params.ujatProgressStatus ?? null,
  })
}

export function usePrograms(params: ListParams = {}) {
  const dataScope = scope()
  const queryClient = useQueryClient()
  const paramsKey = listParamsKey(params)
  const listQueryKey = useMemo(
    () => queryKeys.list(dataScope, JSON.parse(paramsKey) as ListParams),
    [dataScope, paramsKey]
  )

  useLayoutEffect(() => {
    if (dataScope !== 'remote') return
    queryClient.setQueryData<InfiniteData<UjatProgramsRemoteListPage>>(
      listQueryKey,
      keepFirstInfiniteQueryPage
    )
  }, [queryClient, dataScope, listQueryKey])

  return useInfiniteQuery({
    queryKey: listQueryKey,
    queryFn: ({ pageParam }) => listPage(params, pageParam as number),
    initialPageParam: 0,
    getNextPageParam: lastPage => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    staleTime: dataScope === 'remote' ? 30_000 : Infinity,
    retry: shouldRetryQuery,
  })
}

export function useUjatBusinessYears() {
  const remote = shouldUseRemoteApi()
  return useQuery({
    queryKey: queryKeys.businessYears('UJAT'),
    queryFn: fetchUjatProgramBusinessYears,
    enabled: remote,
    staleTime: UJAT_BUSINESS_YEARS_STALE_MS,
    retry: shouldRetryQuery,
  })
}

export function useProgramDetail(
  programId: string | undefined,
  initialData?: Program | null
) {
  const dataScope = scope()
  return useQuery({
    queryKey: queryKeys.detail(dataScope, programId ?? ''),
    queryFn: () => detail(programId!),
    enabled: Boolean(programId),
    // local(mock)만 목록 시드 허용. remote는 상세 GET 전 placeholder로 본문을 채우지 않음.
    initialData: dataScope === 'local' ? (initialData ?? undefined) : undefined,
    placeholderData: dataScope === 'local' ? (initialData ?? undefined) : undefined,
    staleTime: dataScope === 'remote' ? 30_000 : Infinity,
    retry: shouldRetryQuery,
  })
}

export function useCreateProgram() {
  const queryClient = useQueryClient()
  const dataScope = scope()
  return useMutation({
    mutationFn: (input: CreateInput) => create(input),
    retry: false,
    onSuccess: async program => {
      const detailKey = queryKeys.detail(dataScope, program.id)
      queryClient.setQueryData(detailKey, program)
      // 모집 row 미디어는 생성 응답 이후 row PUT으로 연결된다. 다음 상세 조회가
      // thumbnail/attachments를 다시 읽도록 캐시를 stale 처리한다.
      await queryClient.invalidateQueries({ queryKey: detailKey })
      invalidateUjatProgramListCaches(queryClient)
    },
  })
}

export function useUpdateProgram() {
  const queryClient = useQueryClient()
  const dataScope = scope()
  return useMutation({
    mutationFn: (input: {
      programId: string
      program: Program
      patch?: Partial<Program>
    }) => update(input.programId, input.program, input.patch),
    retry: false,
    onSuccess: async (program, variables) => {
      const detailKey = queryKeys.detail(dataScope, variables.programId)
      await syncOpenProgramDetailCache(
        queryClient,
        detailKey,
        program,
        { refetch: false }
      )
      invalidateUjatProgramListCaches(queryClient)
    },
  })
}

export function useBulkDeleteUjatPrograms() {
  const queryClient = useQueryClient()
  const dataScope = scope()
  return useMutation({
    mutationFn: removeMany,
    retry: false,
    onSuccess: async (_data, programIds) => {
      for (const programId of programIds) {
        const detailKey = queryKeys.detail(dataScope, programId)
        await queryClient.cancelQueries({ queryKey: detailKey })
        queryClient.removeQueries({ queryKey: detailKey })
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.lists() })
    },
    onError: error => {
      if (!isProgramHardDeleteBlockedError(error) || error.successCount < 1) return
      void queryClient.invalidateQueries({ queryKey: queryKeys.lists() })
    },
  })
}

export function useDeleteProgram() {
  const queryClient = useQueryClient()
  const dataScope = scope()
  return useMutation({
    mutationFn: remove,
    retry: false,
    onSuccess: async (_data, programId) => {
      const detailKey = queryKeys.detail(dataScope, programId)
      await queryClient.cancelQueries({ queryKey: detailKey })
      queryClient.removeQueries({ queryKey: detailKey })
      invalidateUjatProgramListCaches(queryClient)
    },
  })
}
