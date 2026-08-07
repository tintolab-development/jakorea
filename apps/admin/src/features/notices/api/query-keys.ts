export const noticesQueryKeys = {
  all: ['notices'] as const,
  lists: () => [...noticesQueryKeys.all, 'list'] as const,
  list: (source: 'local' | 'remote', filterKey: string) =>
    [...noticesQueryKeys.lists(), source, filterKey] as const,
  details: () => [...noticesQueryKeys.all, 'detail'] as const,
  detail: (source: 'local' | 'remote', id: string) =>
    [...noticesQueryKeys.details(), source, id] as const,
}
