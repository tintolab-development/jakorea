export const ujatEducationRegionQueryKeys = {
  all: ['ujat-education-regions'] as const,
  lists: () => [...ujatEducationRegionQueryKeys.all, 'list'] as const,
  list: (source: 'remote' | 'local') =>
    [...ujatEducationRegionQueryKeys.lists(), source] as const,
}
