export const corporatePartnerQueryKeys = {
  all: ['corporate-partner'] as const,
  lists: () => [...corporatePartnerQueryKeys.all, 'list'] as const,
  list: (source: 'remote' | 'local', filterKey: string) =>
    [...corporatePartnerQueryKeys.lists(), source, filterKey] as const,
}
