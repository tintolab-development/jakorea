import { useLayoutEffect } from 'react'
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
import { isProgramHardDeleteBlockedError } from '@/features/program/shared/lib/program-delete-guide'
import { shouldUseTrainedTeacherProgramsRemoteApi } from './capabilities'
import { shouldRetryTrainedTeacherQuery } from './errors'
import type { TrainedTeacherListFilters } from './list-params'
import { invalidateTrainedTeacherListCaches } from '@/features/program/shared/lib/invalidate-program-list-caches-after-registration'
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
import { type TrainedTeachersCommonInfoSavePayload } from './info-detail-adapters'
import {
  reflectTrainedTeacherProgramSave,
} from './detail-cache'

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

/** 목록 첫 페이지 쿼리 옵션 — 목록 훅과 상단 위젯 hover 프리페치가 같은 키·캐시 정책을 공유 */
export function trainedTeacherProgramsInfiniteQueryOptions(
  filters: TrainedTeacherListFilters,
  remoteEnabled: boolean
) {
  return infiniteQueryOptions({
    queryKey: trainedTeacherQueryKeys.list(filtersKey(filters, remoteEnabled)),
    queryFn: ({ pageParam }) => listTrainedTeacherProgramsPage(filters, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage: TrainedTeacherProgramsRemoteListPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    staleTime: remoteEnabled ? 30_000 : Number.POSITIVE_INFINITY,
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

  useLayoutEffect(() => {
    if (!enabled || !remoteEnabled) return
    queryClient.setQueryData<InfiniteData<TrainedTeacherProgramsRemoteListPage>>(
      trainedTeacherQueryKeys.list(key),
      keepFirstInfiniteQueryPage
    )
  }, [queryClient, enabled, remoteEnabled, key])

  return useInfiniteQuery({
    ...trainedTeacherProgramsInfiniteQueryOptions(filters, remoteEnabled),
    enabled,
    // 상단 위젯 단계 이동 시 새 키 응답 전까지 이전 목록을 유지 (빈 표 → 스피너 → 표 깜빡임 방지)
    placeholderData: keepPreviousData,
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
    mutationFn: (program: Program) => createTrainedTeacherProgram(program),
    retry: false,
    onSuccess: program => {
      queryClient.setQueryData(trainedTeacherQueryKeys.detail(program.id), program)
      invalidateTrainedTeacherListCaches(queryClient)
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
    onSuccess: async (program, variables) => {
      await reflectTrainedTeacherProgramSave(queryClient, {
        programId: variables.programId,
        echoed: program,
      })
    },
  })
}

export function useDeleteTrainedTeacherProgram() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: trainedTeacherQueryKeys.mutations.delete(''),
    mutationFn: deleteTrainedTeacherProgram,
    retry: false,
    onSuccess: async (_data, programId) => {
      const detailKey = trainedTeacherQueryKeys.detail(programId)
      await queryClient.cancelQueries({ queryKey: detailKey })
      queryClient.removeQueries({ queryKey: detailKey })
      invalidateTrainedTeacherListCaches(queryClient)
    },
  })
}

export function useDeleteTrainedTeacherPrograms() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: [...trainedTeacherQueryKeys.all, 'mutation', 'bulk-delete'] as const,
    mutationFn: deleteTrainedTeacherPrograms,
    retry: false,
    onSuccess: async (_data, programIds) => {
      for (const programId of programIds) {
        const detailKey = trainedTeacherQueryKeys.detail(programId)
        await queryClient.cancelQueries({ queryKey: detailKey })
        queryClient.removeQueries({ queryKey: detailKey })
      }
      invalidateTrainedTeacherListCaches(queryClient)
    },
    onError: error => {
      if (!isProgramHardDeleteBlockedError(error) || error.successCount < 1) return
      invalidateTrainedTeacherListCaches(queryClient)
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
    onSuccess: async (program, variables) => {
      await reflectTrainedTeacherProgramSave(queryClient, {
        programId: variables.programId,
        echoed: program,
      })
    },
  })
}
