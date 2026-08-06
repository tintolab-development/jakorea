export const directionsQueryKeys = {
  all: ['directions'] as const,
  detail: (source: 'remote' | 'local') =>
    [...directionsQueryKeys.all, 'detail', source] as const,
}
