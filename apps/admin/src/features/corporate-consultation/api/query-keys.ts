export const corporateConsultationQueryKeys = {
  all: ['corporate-consultations'] as const,
  lists: () => [...corporateConsultationQueryKeys.all, 'list'] as const,
  list: (source: 'remote' | 'local', filterKey: string) =>
    [...corporateConsultationQueryKeys.lists(), source, filterKey] as const,
  details: () => [...corporateConsultationQueryKeys.all, 'detail'] as const,
  detail: (source: 'remote' | 'local', id: string, revealPii?: boolean) =>
    revealPii === undefined
      ? ([...corporateConsultationQueryKeys.details(), source, id] as const)
      : ([...corporateConsultationQueryKeys.details(), source, id, revealPii] as const),
}
