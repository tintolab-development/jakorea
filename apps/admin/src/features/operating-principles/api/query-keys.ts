export const operatingPrinciplesQueryKeys = {
  all: ['operating-principles'] as const,
  details: () => [...operatingPrinciplesQueryKeys.all, 'detail'] as const,
  detail: (source: 'remote' | 'local') =>
    [...operatingPrinciplesQueryKeys.details(), source] as const,
}
