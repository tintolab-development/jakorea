export const corporatePartnerQueryKeys = {
  all: ['corporate-partner'] as const,
  lists: () => [...corporatePartnerQueryKeys.all, 'list'] as const,
  list: (source: 'remote' | 'local', filterKey: string) =>
    [...corporatePartnerQueryKeys.lists(), source, filterKey] as const,
  /** 페이지 단위 조회 — `list(...)` 아래라 lists() invalidate·행 패치가 함께 적용된다 */
  listPage: (source: 'remote' | 'local', filterKey: string, page: number) =>
    [...corporatePartnerQueryKeys.list(source, filterKey), 'page', page] as const,
}
