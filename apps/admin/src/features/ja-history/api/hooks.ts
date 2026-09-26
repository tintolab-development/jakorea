import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  JaHistoryCtaSaveInput,
  JaHistoryData,
  JaHistoryEraSaveInput,
  JaHistoryHeroSaveInput,
  JaHistoryOriginSaveInput,
  JaHistoryPhilosophySaveInput,
  JaHistoryThriveSaveInput,
  JaHistoryTimelineSaveInput,
} from '@/entities/ja-history/model/types'
import { JaHistorySaveError } from '@/entities/ja-history/model/types'
import { shouldUseJaHistoryRemoteApi } from './capabilities'
import { jaHistoryQueryKeys } from './query-keys'
import {
  getJaHistoryService,
  saveJaHistoryCtaService,
  saveJaHistoryErasService,
  saveJaHistoryHeroService,
  saveJaHistoryKoreaTimelineService,
  saveJaHistoryOriginService,
  saveJaHistoryPhilosophyService,
  saveJaHistoryThriveService,
  saveJaHistoryWorldTimelineService,
} from './service'

function source(): 'remote' | 'local' {
  return shouldUseJaHistoryRemoteApi() ? 'remote' : 'local'
}

export function useJaHistory(enabled = true) {
  const dataSource = source()
  return useQuery({
    queryKey: jaHistoryQueryKeys.detail(dataSource),
    queryFn: () => getJaHistoryService(),
    enabled,
    staleTime: dataSource === 'remote' ? 30_000 : Number.POSITIVE_INFINITY,
    retry: dataSource === 'remote' ? 1 : false,
  })
}

function useJaHistoryMutationHelpers() {
  const queryClient = useQueryClient()
  const dataSource = source()
  const detailKey = jaHistoryQueryKeys.detail(dataSource)

  const readCached = () => queryClient.getQueryData<JaHistoryData>(detailKey)

  const setCache = (data: JaHistoryData) => {
    queryClient.setQueryData(detailKey, data)
  }

  const refetchOnConflict = async (error: unknown) => {
    if (error instanceof JaHistorySaveError && error.code === 'OPTIMISTIC_LOCK') {
      await queryClient.invalidateQueries({ queryKey: detailKey })
    }
  }

  return { readCached, setCache, refetchOnConflict }
}

export function useSaveJaHistoryHero() {
  const { readCached, setCache, refetchOnConflict } = useJaHistoryMutationHelpers()
  return useMutation({
    mutationFn: (input: JaHistoryHeroSaveInput) => saveJaHistoryHeroService(input, readCached()),
    retry: false,
    onSuccess: data => setCache(data),
    onError: error => {
      void refetchOnConflict(error)
    },
  })
}

export function useSaveJaHistoryOrigin() {
  const { readCached, setCache, refetchOnConflict } = useJaHistoryMutationHelpers()
  return useMutation({
    mutationFn: (input: JaHistoryOriginSaveInput) => saveJaHistoryOriginService(input, readCached()),
    retry: false,
    onSuccess: data => setCache(data),
    onError: error => {
      void refetchOnConflict(error)
    },
  })
}

export function useSaveJaHistoryEras() {
  const { readCached, setCache, refetchOnConflict } = useJaHistoryMutationHelpers()
  return useMutation({
    mutationFn: (input: JaHistoryEraSaveInput[]) => saveJaHistoryErasService(input, readCached()),
    retry: false,
    onSuccess: data => setCache(data),
    onError: error => {
      void refetchOnConflict(error)
    },
  })
}

export function useSaveJaHistoryWorldTimeline() {
  const { readCached, setCache, refetchOnConflict } = useJaHistoryMutationHelpers()
  return useMutation({
    mutationFn: (input: JaHistoryTimelineSaveInput) =>
      saveJaHistoryWorldTimelineService(input, readCached()),
    retry: false,
    onSuccess: data => setCache(data),
    onError: error => {
      void refetchOnConflict(error)
    },
  })
}

export function useSaveJaHistoryKoreaTimeline() {
  const { readCached, setCache, refetchOnConflict } = useJaHistoryMutationHelpers()
  return useMutation({
    mutationFn: (input: JaHistoryTimelineSaveInput) =>
      saveJaHistoryKoreaTimelineService(input, readCached()),
    retry: false,
    onSuccess: data => setCache(data),
    onError: error => {
      void refetchOnConflict(error)
    },
  })
}

export function useSaveJaHistoryPhilosophy() {
  const { readCached, setCache, refetchOnConflict } = useJaHistoryMutationHelpers()
  return useMutation({
    mutationFn: (input: JaHistoryPhilosophySaveInput) =>
      saveJaHistoryPhilosophyService(input, readCached()),
    retry: false,
    onSuccess: data => setCache(data),
    onError: error => {
      void refetchOnConflict(error)
    },
  })
}

export function useSaveJaHistoryThrive() {
  const { readCached, setCache, refetchOnConflict } = useJaHistoryMutationHelpers()
  return useMutation({
    mutationFn: (input: JaHistoryThriveSaveInput) => saveJaHistoryThriveService(input, readCached()),
    retry: false,
    onSuccess: data => setCache(data),
    onError: error => {
      void refetchOnConflict(error)
    },
  })
}

export function useSaveJaHistoryCta() {
  const { readCached, setCache, refetchOnConflict } = useJaHistoryMutationHelpers()
  return useMutation({
    mutationFn: (input: JaHistoryCtaSaveInput) => saveJaHistoryCtaService(input, readCached()),
    retry: false,
    onSuccess: data => setCache(data),
    onError: error => {
      void refetchOnConflict(error)
    },
  })
}
