export const geminiPerformanceQueryKeys = {
  all: ['cms', 'programs', 'gemini', 'performance'] as const,
  list: () => [...geminiPerformanceQueryKeys.all, 'list'] as const,
}
