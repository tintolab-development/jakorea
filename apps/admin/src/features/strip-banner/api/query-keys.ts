import type { StripBannerListFilter } from '@/entities/strip-banner/model/types'

export const stripBannerQueryKeys = {
  all: ['strip-banners'] as const,
  lists: () => [...stripBannerQueryKeys.all, 'list'] as const,
  list: (source: 'remote' | 'local', filter?: StripBannerListFilter) =>
    [...stripBannerQueryKeys.lists(), source, filter ?? {}] as const,
}
