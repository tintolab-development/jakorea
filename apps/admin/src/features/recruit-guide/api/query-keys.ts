export const recruitGuideQueryKeys = {
  all: ['recruit-guide'] as const,
  detail: (source: 'remote' | 'local') =>
    [...recruitGuideQueryKeys.all, 'detail', source] as const,
}
