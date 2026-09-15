import { useLayoutEffect, useMemo } from 'react'
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query'
import type { Program } from '@/types/domain'
import { shouldUseRemoteApi } from './capabilities'
import { shouldRetryQuery } from './errors'
import type { ListParams } from './list-params'
import { queryKeys } from './query-keys'
import {
  create,
  detail,
  listPage,
  remove,
  update,
  type CreateInput,
  type UjatProgramsRemoteListPage,
} from './service'

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
    onSuccess: program => {
      queryClient.setQueryData(queryKeys.detail(dataScope, program.id), program)
      void queryClient.invalidateQueries({ queryKey: queryKeys.lists() })
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
    onSuccess: program => {
      queryClient.setQueryData(queryKeys.detail(dataScope, program.id), program)
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
    onSuccess: (_data, programId) => {
      queryClient.removeQueries({ queryKey: queryKeys.detail(dataScope, programId) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.lists() })
    },
  })
}
