export const mainContentQueryKeys = {
  all: ['main-contents'] as const,
  detail: (source: 'remote' | 'local') => [...mainContentQueryKeys.all, 'detail', source] as const,
  impactOptions: (source: 'remote' | 'local') =>
    [...mainContentQueryKeys.all, 'impact-options', source] as const,
}
