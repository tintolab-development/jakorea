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
import { shouldUseTrainedTeacherProgramsRemoteApi } from './capabilities'
import { shouldRetryTrainedTeacherQuery } from './errors'
import type { TrainedTeacherListFilters } from './list-params'
import { trainedTeacherQueryKeys } from './query-keys'
import {
  createTrainedTeacherProgram,
  deleteTrainedTeacherProgram,
  deleteTrainedTeacherPrograms,
  fetchTrainedTeacherOverviewStages,
  getTrainedTeacherProgram,
  listTrainedTeacherProgramsPage,
  updateTrainedTeacherProgram,
  updateTrainedTeacherProgramInfoDetail,
  type TrainedTeacherProgramsRemoteListPage,
} from './service'
import type { TrainedTeachersCommonInfoSavePayload } from './info-detail-adapters'

function filtersKey(filters: TrainedTeacherListFilters, remoteEnabled: boolean): string {
  return JSON.stringify({ source: remoteEnabled ? 'remote' : 'mock', ...filters })
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

function invalidateTrainedTeacherOverviewStages(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: trainedTeacherQueryKeys.overviewStages() })
}

/** 교육받은 교사 목록 상단 4카드 건수 (목록과 동일 데이터 소스) */
export function useTrainedTeacherOverviewStages(enabled = true) {
  const remoteEnabled = shouldUseTrainedTeacherProgramsRemoteApi()

  return useQuery({
    queryKey: trainedTeacherQueryKeys.overviewStages(),
    queryFn: fetchTrainedTeacherOverviewStages,
    enabled: enabled && remoteEnabled,
    staleTime: 30_000,
    retry: shouldRetryTrainedTeacherQuery,
  })
}

export function useTrainedTeacherPrograms(
  filters: TrainedTeacherListFilters = {},
  enabled = true
) {
  const remoteEnabled = shouldUseTrainedTeacherProgramsRemoteApi()
  const queryClient = useQueryClient()
  const key = filtersKey(filters, remoteEnabled)
  const listQueryKey = useMemo(() => trainedTeacherQueryKeys.list(key), [key])

  useLayoutEffect(() => {
    if (!enabled || !remoteEnabled) return
    queryClient.setQueryData<InfiniteData<TrainedTeacherProgramsRemoteListPage>>(
      listQueryKey,
      keepFirstInfiniteQueryPage
    )
  }, [queryClient, enabled, remoteEnabled, listQueryKey])

  return useInfiniteQuery({
    queryKey: listQueryKey,
    queryFn: ({ pageParam }) => listTrainedTeacherProgramsPage(filters, pageParam as number),
    initialPageParam: 0,
    getNextPageParam: lastPage => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    enabled,
    staleTime: remoteEnabled ? 30_000 : Number.POSITIVE_INFINITY,
    retry: shouldRetryTrainedTeacherQuery,
  })
}

export function useTrainedTeacherProgramDetail(
  programId: string | undefined,
  enabled = true
) {
  return useQuery({
    queryKey: trainedTeacherQueryKeys.detail(programId ?? ''),
    queryFn: () => getTrainedTeacherProgram(programId!),
    enabled: enabled && Boolean(programId),
    staleTime: 30_000,
    retry: shouldRetryTrainedTeacherQuery,
  })
}

export function useCreateTrainedTeacherProgram() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: trainedTeacherQueryKeys.mutations.create(),
    mutationFn: createTrainedTeacherProgram,
    retry: false,
    onSuccess: program => {
      queryClient.setQueryData(trainedTeacherQueryKeys.detail(program.id), program)
      void queryClient.invalidateQueries({ queryKey: trainedTeacherQueryKeys.lists() })
      invalidateTrainedTeacherOverviewStages(queryClient)
    },
  })
}

export function useUpdateTrainedTeacherProgram() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: trainedTeacherQueryKeys.mutations.update(''),
    mutationFn: ({
      programId,
      program,
      patch,
    }: {
      programId: string
      program: Program
      patch?: Partial<Program>
    }) => updateTrainedTeacherProgram(programId, program, patch),
    retry: false,
    onSuccess: program => {
      queryClient.setQueryData(trainedTeacherQueryKeys.detail(program.id), program)
      void queryClient.invalidateQueries({ queryKey: trainedTeacherQueryKeys.lists() })
      invalidateTrainedTeacherOverviewStages(queryClient)
    },
  })
}

export function useDeleteTrainedTeacherProgram() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: trainedTeacherQueryKeys.mutations.delete(''),
    mutationFn: deleteTrainedTeacherProgram,
    retry: false,
    onSuccess: (_data, programId) => {
      queryClient.removeQueries({ queryKey: trainedTeacherQueryKeys.detail(programId) })
      void queryClient.invalidateQueries({ queryKey: trainedTeacherQueryKeys.lists() })
      invalidateTrainedTeacherOverviewStages(queryClient)
    },
  })
}

export function useDeleteTrainedTeacherPrograms() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: [...trainedTeacherQueryKeys.all, 'mutation', 'bulk-delete'] as const,
    mutationFn: deleteTrainedTeacherPrograms,
    retry: false,
    onSuccess: (_data, programIds) => {
      for (const programId of programIds) {
        queryClient.removeQueries({ queryKey: trainedTeacherQueryKeys.detail(programId) })
      }
      void queryClient.invalidateQueries({ queryKey: trainedTeacherQueryKeys.lists() })
      invalidateTrainedTeacherOverviewStages(queryClient)
    },
  })
}

export function useUpdateTrainedTeacherProgramInfoDetail() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: [...trainedTeacherQueryKeys.all, 'mutation', 'info-detail'] as const,
    mutationFn: ({
      programId,
      payload,
    }: {
      programId: string
      payload: TrainedTeachersCommonInfoSavePayload
    }) => updateTrainedTeacherProgramInfoDetail(programId, payload),
    retry: false,
    onSuccess: program => {
      queryClient.setQueryData(trainedTeacherQueryKeys.detail(program.id), program)
      void queryClient.invalidateQueries({ queryKey: trainedTeacherQueryKeys.lists() })
      invalidateTrainedTeacherOverviewStages(queryClient)
    },
  })
}
