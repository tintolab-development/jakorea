export const geminiVisitingTrainingQueryKeys = {
  all: ['cms', 'programs', 'gemini', 'visiting-training'] as const,
  recruitments: () => [...geminiVisitingTrainingQueryKeys.all, 'recruitments'] as const,
  recruitmentList: (filtersKey?: string) =>
    filtersKey === undefined
      ? ([...geminiVisitingTrainingQueryKeys.recruitments(), 'list'] as const)
      : ([...geminiVisitingTrainingQueryKeys.recruitments(), 'list', 'remote', filtersKey] as const),
  recruitmentDetail: (programId: string) =>
    [...geminiVisitingTrainingQueryKeys.recruitments(), 'detail', programId] as const,
  organizationApplications: (programId: string, filtersKey = '') =>
    [
      ...geminiVisitingTrainingQueryKeys.recruitments(),
      'organization-applications',
      'remote',
      programId,
      filtersKey,
    ] as const,
  approved: () => [...geminiVisitingTrainingQueryKeys.all, 'approved'] as const,
  approvedList: (filtersKey = '') =>
    [...geminiVisitingTrainingQueryKeys.approved(), 'list', 'remote', filtersKey] as const,
}
