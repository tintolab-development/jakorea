export const performanceQueryKeys = {
  all: ['cms', 'performance'] as const,
  lists: () => [...performanceQueryKeys.all, 'list'] as const,
  list: (filterKey = '') => [...performanceQueryKeys.lists(), filterKey] as const,
  summaries: () => [...performanceQueryKeys.all, 'summary'] as const,
  summary: (filterKey = '') => [...performanceQueryKeys.summaries(), filterKey] as const,
}
