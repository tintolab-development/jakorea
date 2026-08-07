import type { CorporatePartnerListFilter } from '@/entities/corporate-partner/model/types'

export const corporatePartnerQueryKeys = {
  all: ['corporate-partner'] as const,
  lists: () => [...corporatePartnerQueryKeys.all, 'list'] as const,
  list: (source: 'remote' | 'local', filter?: CorporatePartnerListFilter) =>
    [...corporatePartnerQueryKeys.lists(), source, filter ?? {}] as const,
}
