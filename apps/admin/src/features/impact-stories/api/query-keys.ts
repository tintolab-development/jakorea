export const impactStoriesQueryKeys = {
  all: ['impact-stories'] as const,
  lists: () => [...impactStoriesQueryKeys.all, 'list'] as const,
  list: (source: 'local' | 'remote', filterKey: string) =>
    [...impactStoriesQueryKeys.lists(), source, filterKey] as const,
  details: () => [...impactStoriesQueryKeys.all, 'detail'] as const,
  detail: (source: 'local' | 'remote', id: string) =>
    [...impactStoriesQueryKeys.details(), source, id] as const,
  categories: (source: 'local' | 'remote') =>
    [...impactStoriesQueryKeys.all, 'categories', source] as const,
}
