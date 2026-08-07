export const globalValueQueryKeys = {
  all: ['global-values'] as const,
  lists: () => [...globalValueQueryKeys.all, 'list'] as const,
  list: (source: 'remote' | 'local') => [...globalValueQueryKeys.lists(), source] as const,
}
