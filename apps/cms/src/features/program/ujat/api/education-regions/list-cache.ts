import type { QueryClient } from '@tanstack/react-query'
import type { UjatEducationRegion } from '@/features/program/ujat/model/education-region.types'
import { normalizeEducationRegionSort } from './adapters'
import { ujatEducationRegionQueryKeys } from './query-keys'

function isRegionList(value: unknown): value is UjatEducationRegion[] {
  return Array.isArray(value)
}

function patchList(
  queryClient: QueryClient,
  key: readonly unknown[],
  updater: (old: UjatEducationRegion[] | undefined) => UjatEducationRegion[] | undefined
): void {
  queryClient.setQueryData<UjatEducationRegion[]>(key, old => updater(isRegionList(old) ? old : undefined))
}

export function applyCreatedEducationRegion(
  queryClient: QueryClient,
  source: 'remote' | 'local',
  created: UjatEducationRegion
): void {
  const append = (old: UjatEducationRegion[] | undefined) => {
    if (!old) return [created]
    if (old.some(row => row.id === created.id)) return old
    return normalizeEducationRegionSort([...old, created])
  }
  patchList(queryClient, ujatEducationRegionQueryKeys.list(source), append)
  if (created.active) {
    patchList(queryClient, ujatEducationRegionQueryKeys.activeList(source), append)
  }
}

export function applyUpdatedEducationRegion(
  queryClient: QueryClient,
  source: 'remote' | 'local',
  updated: UjatEducationRegion
): void {
  patchList(queryClient, ujatEducationRegionQueryKeys.list(source), old => {
    if (!old) return [updated]
    return normalizeEducationRegionSort(
      old.map(row => (row.id === updated.id ? updated : row))
    )
  })
  patchList(queryClient, ujatEducationRegionQueryKeys.activeList(source), old => {
    const without = (old ?? []).filter(row => row.id !== updated.id)
    if (!updated.active) return without
    return normalizeEducationRegionSort([...without, updated])
  })
}

export function applyDeletedEducationRegion(
  queryClient: QueryClient,
  source: 'remote' | 'local',
  id: string
): void {
  const remove = (old: UjatEducationRegion[] | undefined) =>
    old ? old.filter(row => row.id !== id) : old
  patchList(queryClient, ujatEducationRegionQueryKeys.list(source), remove)
  patchList(queryClient, ujatEducationRegionQueryKeys.activeList(source), remove)
}
