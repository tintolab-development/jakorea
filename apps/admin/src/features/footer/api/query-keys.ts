export const footerQueryKeys = {
  all: ['footer'] as const,
  topMenus: () => [...footerQueryKeys.all, 'top-menus'] as const,
  topMenusList: (source: 'remote' | 'local') =>
    [...footerQueryKeys.topMenus(), source] as const,
  orgInfo: () => [...footerQueryKeys.all, 'org-info'] as const,
  orgInfoDetail: (source: 'remote' | 'local') =>
    [...footerQueryKeys.orgInfo(), source] as const,
  relatedLogos: () => [...footerQueryKeys.all, 'related-logos'] as const,
  relatedLogosList: (source: 'remote' | 'local') =>
    [...footerQueryKeys.relatedLogos(), source] as const,
}
