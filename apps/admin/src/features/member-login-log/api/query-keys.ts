import type { MemberLoginListFilter } from '@/entities/member-login-log/model/types'

export const memberLoginLogQueryKeys = {
  all: ['member-login-log'] as const,
  list: (source: 'remote' | 'local', filter: MemberLoginListFilter) =>
    [
      ...memberLoginLogQueryKeys.all,
      'list',
      source,
      filter.audience,
      filter.name ?? '',
      filter.loginId ?? '',
      filter.from ?? '',
      filter.to ?? '',
    ] as const,
}
