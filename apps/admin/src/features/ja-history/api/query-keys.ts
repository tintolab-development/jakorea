export const jaHistoryQueryKeys = {
  all: ['ja-history'] as const,
  detail: (source: 'remote' | 'local') => [...jaHistoryQueryKeys.all, 'detail', source] as const,
}
