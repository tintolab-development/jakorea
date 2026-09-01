export const jaKoreaBiQueryKeys = {
  all: ['ja-korea-bi'] as const,
  detail: (source: 'remote' | 'local') =>
    [...jaKoreaBiQueryKeys.all, 'detail', source] as const,
}
