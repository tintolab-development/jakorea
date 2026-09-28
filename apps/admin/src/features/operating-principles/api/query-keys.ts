export const operatingPrinciplesQueryKeys = {
  all: ['operating-principles'] as const,
  details: () => [...operatingPrinciplesQueryKeys.all, 'detail'] as const,
  detail: () => [...operatingPrinciplesQueryKeys.details(), 'remote'] as const,
}
