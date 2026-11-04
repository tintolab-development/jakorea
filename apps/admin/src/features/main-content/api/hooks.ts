import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  DonationSection,
  EducationSection,
  ImpactStorySection,
  MainContents,
  PerformanceSection,
} from '@/entities/main-content/model/types'
import { isImpactFeaturedStoryConflictError } from '@/features/main-content/lib/mutation-failure-alert'
import { isOptimisticLockConflictError } from '@/shared/lib/api-error-message'
import { shouldUseMainContentRemoteApi } from './capabilities'
import { mainContentQueryKeys } from './query-keys'
import {
  getMainContentsService,
  listImpactStoryOptionsService,
  saveDonationSectionService,
  saveEducationSectionService,
  saveImpactStorySectionService,
  savePerformanceSectionService,
} from './service'

function source(): 'remote' | 'local' {
  return shouldUseMainContentRemoteApi() ? 'remote' : 'local'
}

function cachedContents(
  queryClient: ReturnType<typeof useQueryClient>,
): MainContents | undefined {
  return queryClient.getQueryData<MainContents>(mainContentQueryKeys.detail(source()))
}

export function useMainContents(enabled = true) {
  const dataSource = source()
  return useQuery({
    queryKey: mainContentQueryKeys.detail(dataSource),
    queryFn: () => getMainContentsService(),
    enabled,
    staleTime: dataSource === 'remote' ? 30_000 : Number.POSITIVE_INFINITY,
    retry: dataSource === 'remote' ? 1 : false,
  })
}

export function useImpactStoryOptions(enabled = true) {
  const dataSource = source()
  const contentsQuery = useMainContents(enabled && dataSource === 'remote')
  const localQuery = useQuery({
    queryKey: mainContentQueryKeys.impactOptions(dataSource),
    queryFn: () => listImpactStoryOptionsService(),
    enabled: enabled && dataSource === 'local',
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
  })

  if (dataSource === 'remote') {
    return {
      ...contentsQuery,
      data: contentsQuery.data?.impactStoryOptions ?? [],
    }
  }
  return localQuery
}

function useApplyMainContents() {
  const queryClient = useQueryClient()
  return (data: MainContents) => {
    queryClient.setQueryData(mainContentQueryKeys.detail(source()), data)
  }
}

function useRefetchOnConflict() {
  const queryClient = useQueryClient()
  return (error: unknown) => {
    if (
      isOptimisticLockConflictError(error) ||
      isImpactFeaturedStoryConflictError(error)
    ) {
      void queryClient.invalidateQueries({ queryKey: mainContentQueryKeys.detail(source()) })
    }
  }
}

export function useSaveEducationSection() {
  const queryClient = useQueryClient()
  const apply = useApplyMainContents()
  const refetchOnConflict = useRefetchOnConflict()
  return useMutation({
    mutationFn: (section: EducationSection) =>
      saveEducationSectionService(section, cachedContents(queryClient)),
    retry: false,
    onSuccess: apply,
    onError: refetchOnConflict,
  })
}

export function useSaveImpactStorySection() {
  const queryClient = useQueryClient()
  const apply = useApplyMainContents()
  const refetchOnConflict = useRefetchOnConflict()
  return useMutation({
    mutationFn: (section: ImpactStorySection) =>
      saveImpactStorySectionService(section, cachedContents(queryClient)),
    retry: false,
    onSuccess: apply,
    onError: refetchOnConflict,
  })
}

export function useSavePerformanceSection() {
  const queryClient = useQueryClient()
  const apply = useApplyMainContents()
  const refetchOnConflict = useRefetchOnConflict()
  return useMutation({
    mutationFn: (section: PerformanceSection) =>
      savePerformanceSectionService(section, cachedContents(queryClient)),
    retry: false,
    onSuccess: apply,
    onError: refetchOnConflict,
  })
}

export function useSaveDonationSection() {
  const queryClient = useQueryClient()
  const apply = useApplyMainContents()
  const refetchOnConflict = useRefetchOnConflict()
  return useMutation({
    mutationFn: (section: DonationSection) =>
      saveDonationSectionService(section, cachedContents(queryClient)),
    retry: false,
    onSuccess: apply,
    onError: refetchOnConflict,
  })
}
