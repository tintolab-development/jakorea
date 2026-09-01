export const jaKoreaIntroQueryKeys = {
  all: ['ja-korea-intro'] as const,
  detail: (source: 'remote' | 'local') =>
    [...jaKoreaIntroQueryKeys.all, 'detail', source] as const,
}
