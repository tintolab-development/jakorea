export const companySchoolQueryKeys = {
  all: ['cms', 'programs', 'company-school'] as const,
  lists: () => [...companySchoolQueryKeys.all, 'list'] as const,
  list: (filtersKey = '') => [...companySchoolQueryKeys.lists(), filtersKey] as const,
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
