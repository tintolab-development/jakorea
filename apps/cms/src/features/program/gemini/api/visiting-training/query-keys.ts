export const geminiVisitingTrainingQueryKeys = {
  all: ['cms', 'programs', 'gemini', 'visiting-training'] as const,
  recruitments: () => [...geminiVisitingTrainingQueryKeys.all, 'recruitments'] as const,
  recruitmentList: () => [...geminiVisitingTrainingQueryKeys.recruitments(), 'list'] as const,
  recruitmentDetail: (programId: string) =>
    [...geminiVisitingTrainingQueryKeys.recruitments(), 'detail', programId] as const,
  organizationApplications: (programId: string) =>
    [
      ...geminiVisitingTrainingQueryKeys.recruitments(),
      'organization-applications',
      programId,
    ] as const,
  approved: () => [...geminiVisitingTrainingQueryKeys.all, 'approved'] as const,
  approvedList: () => [...geminiVisitingTrainingQueryKeys.approved(), 'list'] as const,
}
