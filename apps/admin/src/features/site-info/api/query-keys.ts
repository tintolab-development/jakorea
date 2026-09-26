export const siteInfoQueryKeys = {
  all: ['site-info'] as const,
  detail: () => [...siteInfoQueryKeys.all, 'detail', 'remote'] as const,
}
