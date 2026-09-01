export const jaKoreaWorldwideQueryKeys = {
  all: ['ja-korea-worldwide'] as const,
  detail: (source: 'remote' | 'local') =>
    [...jaKoreaWorldwideQueryKeys.all, 'detail', source] as const,
}
