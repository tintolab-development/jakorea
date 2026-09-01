export const footerQueryKeys = {
  all: ['footer'] as const,
  /** remote/local 공유 번들 — GET /footer 1회 */
  admin: (source: 'remote' | 'local') => [...footerQueryKeys.all, 'admin', source] as const,
  /** @deprecated 하위 호환 — admin 키로 통합 */
  topMenus: () => [...footerQueryKeys.all, 'top-menus'] as const,
  topMenusList: (source: 'remote' | 'local') => footerQueryKeys.admin(source),
  orgInfo: () => [...footerQueryKeys.all, 'org-info'] as const,
  orgInfoDetail: (source: 'remote' | 'local') => footerQueryKeys.admin(source),
  relatedLogos: () => [...footerQueryKeys.all, 'related-logos'] as const,
  relatedLogosList: (source: 'remote' | 'local') => footerQueryKeys.admin(source),
}
