import { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Program } from '@/types/domain'
import { shouldUseRemoteApi } from './capabilities'
import { shouldRetryQuery } from './errors'
import type { ListParams } from './list-params'
import { queryKeys } from './query-keys'
import {
  create,
  detail,
  list,
  remove,
  update,
  type CreateInput,
} from './service'

function scope(): 'remote' | 'local' {
  return shouldUseRemoteApi() ? 'remote' : 'local'
}

export function usePrograms(params: ListParams = {}) {
  const dataScope = scope()
  return useQuery({
    queryKey: queryKeys.list(dataScope, params),
    queryFn: () => list(params),
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

export function usePrefetchProgramDetail() {
  const queryClient = useQueryClient()
  const dataScope = scope()

  return useCallback(
    (programId: string) => {
      if (!programId || dataScope !== 'remote') return
      void queryClient.prefetchQuery({
        queryKey: queryKeys.detail(dataScope, programId),
        queryFn: () => detail(programId),
        staleTime: 30_000,
        retry: shouldRetryQuery,
      })
    },
    [queryClient, dataScope]
  )
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
