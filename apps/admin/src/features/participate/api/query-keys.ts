export const participateQueryKeys = {
  all: ['participate'] as const,
  menuLinks: () => [...participateQueryKeys.all, 'menu-links'] as const,
  menuLinksDetail: (source: 'remote' | 'local') =>
    [...participateQueryKeys.menuLinks(), source] as const,
}
