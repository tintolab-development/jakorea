import { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Program } from '@/types/domain'
import { shouldUseTrainedTeacherProgramsRemoteApi } from './capabilities'
import { shouldRetryTrainedTeacherQuery } from './errors'
import type { TrainedTeacherListFilters } from './list-params'
import { trainedTeacherQueryKeys } from './query-keys'
import {
  createTrainedTeacherProgram,
  deleteTrainedTeacherProgram,
  deleteTrainedTeacherPrograms,
  getTrainedTeacherProgram,
  listTrainedTeacherPrograms,
  updateTrainedTeacherProgram,
  updateTrainedTeacherProgramInfoDetail,
} from './service'
import type { TrainedTeachersCommonInfoSavePayload } from './info-detail-adapters'

function filtersKey(filters: TrainedTeacherListFilters, remoteEnabled: boolean): string {
  return JSON.stringify({ source: remoteEnabled ? 'remote' : 'mock', ...filters })
}

export function useTrainedTeacherPrograms(
  filters: TrainedTeacherListFilters = {},
  enabled = true
) {
  const remoteEnabled = shouldUseTrainedTeacherProgramsRemoteApi()
  return useQuery({
    queryKey: trainedTeacherQueryKeys.list(filtersKey(filters, remoteEnabled)),
    queryFn: () => listTrainedTeacherPrograms(filters),
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

export function usePrefetchTrainedTeacherProgramDetail() {
  const queryClient = useQueryClient()
  const remoteEnabled = shouldUseTrainedTeacherProgramsRemoteApi()

  return useCallback(
    (programId: string) => {
      if (!remoteEnabled || !programId) return
      void queryClient.prefetchQuery({
        queryKey: trainedTeacherQueryKeys.detail(programId),
        queryFn: () => getTrainedTeacherProgram(programId),
        staleTime: 30_000,
        retry: shouldRetryTrainedTeacherQuery,
      })
    },
    [queryClient, remoteEnabled]
  )
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
    },
  })
}
