export const corporateGuideQueryKeys = {
  all: ['corporate-guide'] as const,
  detail: (source: 'remote' | 'local') =>
    [...corporateGuideQueryKeys.all, 'detail', source] as const,
}
