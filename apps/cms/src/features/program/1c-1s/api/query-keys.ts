export const companySchoolQueryKeys = {
  all: ['cms', 'programs', 'company-school'] as const,
  lists: () => [...companySchoolQueryKeys.all, 'list'] as const,
  list: (filtersKey = '') => [...companySchoolQueryKeys.lists(), filtersKey] as const,
  /** 상단 4카드 위젯 건수 — list 무효화와 함께 갱신 */
  overviewStages: () => [...companySchoolQueryKeys.all, 'overview-stages'] as const,
  details: () => [...companySchoolQueryKeys.all, 'detail'] as const,
  detail: (programId: string) =>
    [...companySchoolQueryKeys.details(), programId] as const,
  mutations: {
    create: () => [...companySchoolQueryKeys.all, 'mutation', 'create'] as const,
    update: (programId: string) =>
      [...companySchoolQueryKeys.all, 'mutation', 'update', programId] as const,
    delete: (programId: string) =>
      [...companySchoolQueryKeys.all, 'mutation', 'delete', programId] as const,
  },
}
