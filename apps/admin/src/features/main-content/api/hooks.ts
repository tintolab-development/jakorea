import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  DonationSection,
  EducationSection,
  ImpactStorySection,
  PerformanceSection,
} from '@/entities/main-content/model/types'
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

function useInvalidateMainContents() {
  const queryClient = useQueryClient()
  return (data: Awaited<ReturnType<typeof getMainContentsService>>) => {
    queryClient.setQueryData(mainContentQueryKeys.detail(source()), data)
    void queryClient.invalidateQueries({ queryKey: mainContentQueryKeys.all })
  }
}

export function useSaveEducationSection() {
  const apply = useInvalidateMainContents()
  return useMutation({
    mutationFn: (section: EducationSection) => saveEducationSectionService(section),
    retry: false,
    onSuccess: apply,
  })
}

export function useSaveImpactStorySection() {
  const apply = useInvalidateMainContents()
  return useMutation({
    mutationFn: (section: ImpactStorySection) => saveImpactStorySectionService(section),
    retry: false,
    onSuccess: apply,
  })
}

export function useSavePerformanceSection() {
  const apply = useInvalidateMainContents()
  return useMutation({
    mutationFn: (section: PerformanceSection) => savePerformanceSectionService(section),
    retry: false,
    onSuccess: apply,
  })
}

export function useSaveDonationSection() {
  const apply = useInvalidateMainContents()
  return useMutation({
    mutationFn: (section: DonationSection) => saveDonationSectionService(section),
    retry: false,
    onSuccess: apply,
  })
}
