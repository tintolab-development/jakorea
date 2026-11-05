import type { UjatEducationRegionFilters } from '@/features/program/ujat/model/education-region.types'

export const ujatEducationRegionQueryKeys = {
  all: ['ujat-education-regions'] as const,
  lists: () => [...ujatEducationRegionQueryKeys.all, 'list'] as const,
  list: (source: 'remote' | 'local') =>
    [...ujatEducationRegionQueryKeys.lists(), source] as const,
  activeList: (source: 'remote' | 'local') =>
    [...ujatEducationRegionQueryKeys.lists(), source, 'active'] as const,
  filteredLists: () => [...ujatEducationRegionQueryKeys.all, 'filtered'] as const,
  filteredList: (source: 'remote' | 'local', filters: UjatEducationRegionFilters) =>
    [
      ...ujatEducationRegionQueryKeys.filteredLists(),
      source,
      filters.usageStatus,
      filters.name.trim(),
    ] as const,
}
