export const performanceQueryKeys = {
  all: ['cms', 'performance'] as const,
  list: () => [...performanceQueryKeys.all, 'list'] as const,
}
