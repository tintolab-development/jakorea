import type { QueryClient } from '@tanstack/react-query'
import type { UjatEducationRegion } from '@/features/program/ujat/model/education-region.types'
import { normalizeEducationRegionSort } from './adapters'
import { ujatEducationRegionQueryKeys } from './query-keys'

function isRegionList(value: unknown): value is UjatEducationRegion[] {
  return Array.isArray(value)
}

export function applyCreatedEducationRegion(
  queryClient: QueryClient,
  source: 'remote' | 'local',
  created: UjatEducationRegion
): void {
  const key = ujatEducationRegionQueryKeys.list(source)
  queryClient.setQueryData<UjatEducationRegion[]>(key, old => {
    if (!isRegionList(old)) return [created]
    if (old.some(row => row.id === created.id)) return old
    return normalizeEducationRegionSort([...old, created])
  })
}

export function applyUpdatedEducationRegion(
  queryClient: QueryClient,
  source: 'remote' | 'local',
  updated: UjatEducationRegion
): void {
  const key = ujatEducationRegionQueryKeys.list(source)
  queryClient.setQueryData<UjatEducationRegion[]>(key, old => {
    if (!isRegionList(old)) return [updated]
    return normalizeEducationRegionSort(
      old.map(row => (row.id === updated.id ? updated : row))
    )
  })
}

export function applyDeletedEducationRegion(
  queryClient: QueryClient,
  source: 'remote' | 'local',
  id: string
): void {
  const key = ujatEducationRegionQueryKeys.list(source)
  queryClient.setQueryData<UjatEducationRegion[]>(key, old =>
    isRegionList(old) ? old.filter(row => row.id !== id) : old
  )
}
