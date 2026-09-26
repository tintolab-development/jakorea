export const recruitApplicantQueryKeys = {
  all: ['recruit-applicants'] as const,
  lists: () => [...recruitApplicantQueryKeys.all, 'list'] as const,
  list: (source: 'local' | 'remote', filterKey: string) =>
    [...recruitApplicantQueryKeys.lists(), source, filterKey] as const,
}
