import type { AdminAccountListFilter } from '@/entities/admin-account-log/model/types'

export const adminAccountLogQueryKeys = {
  all: ['admin-account-log'] as const,
  list: (source: 'remote' | 'local', filter: AdminAccountListFilter) =>
    [
      ...adminAccountLogQueryKeys.all,
      'list',
      source,
      filter.name ?? '',
      filter.loginId ?? '',
      filter.actionType ?? '',
      filter.from ?? '',
      filter.to ?? '',
    ] as const,
}
