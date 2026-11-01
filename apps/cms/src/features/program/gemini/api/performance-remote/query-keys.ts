export type GeminiPerformanceListQueryFilters = {
  instructorName?: string
  trainingLocation?: string
}

export const geminiPerformanceQueryKeys = {
  all: ['cms', 'programs', 'gemini', 'performance'] as const,
  list: (filters: GeminiPerformanceListQueryFilters | string = {}) =>
    [
      ...geminiPerformanceQueryKeys.all,
      'list',
      typeof filters === 'string' ? filters : JSON.stringify(filters),
    ] as const,
}
