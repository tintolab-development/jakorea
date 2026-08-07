import type { VisitorStatsQuery } from '@/entities/visitor-stats/model/types'

export const visitorStatsQueryKeys = {
  all: ['visitor-stats'] as const,
  stats: (source: 'remote' | 'local', query: VisitorStatsQuery) =>
    [
      ...visitorStatsQueryKeys.all,
      'stats',
      source,
      query.unit,
      query.years.slice().sort().join(','),
      query.months.slice().sort().join(','),
      query.from ?? '',
      query.to ?? '',
    ] as const,
}
