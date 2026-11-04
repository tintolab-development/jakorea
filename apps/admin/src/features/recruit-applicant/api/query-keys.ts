export const recruitApplicantQueryKeys = {
  all: ['recruit-applicants'] as const,
  lists: () => [...recruitApplicantQueryKeys.all, 'list'] as const,
  list: (source: 'local' | 'remote', filterKey: string) =>
    [...recruitApplicantQueryKeys.lists(), source, filterKey] as const,
  details: () => [...recruitApplicantQueryKeys.all, 'detail'] as const,
  detail: (source: 'local' | 'remote', id: string, revealPii?: boolean) =>
    revealPii === undefined
      ? ([...recruitApplicantQueryKeys.details(), source, id] as const)
      : ([...recruitApplicantQueryKeys.details(), source, id, revealPii] as const),
}
