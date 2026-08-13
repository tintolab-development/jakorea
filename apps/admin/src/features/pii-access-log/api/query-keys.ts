import type { PiiAccessListFilter } from '@/entities/pii-access-log/model/types'

export const piiAccessLogQueryKeys = {
  all: ['pii-access-log'] as const,
  list: (source: 'remote' | 'local', filter: PiiAccessListFilter) =>
    [
      ...piiAccessLogQueryKeys.all,
      'list',
      source,
      filter.targetName ?? '',
      filter.purpose ?? '',
      filter.accessorName ?? '',
      filter.from ?? '',
      filter.to ?? '',
    ] as const,
}
