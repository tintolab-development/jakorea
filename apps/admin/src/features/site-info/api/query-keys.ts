export const siteInfoQueryKeys = {
  all: ['site-info'] as const,
  detail: (source: 'remote' | 'local') => [...siteInfoQueryKeys.all, 'detail', source] as const,
}
