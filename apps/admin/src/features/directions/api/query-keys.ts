export const directionsQueryKeys = {
  all: ['directions'] as const,
  detail: () => [...directionsQueryKeys.all, 'detail', 'remote'] as const,
}
