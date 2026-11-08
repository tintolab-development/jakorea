export const geminiVisitingTrainingQueryKeys = {
  all: ['cms', 'programs', 'gemini', 'visiting-training'] as const,
  recruitments: () => [...geminiVisitingTrainingQueryKeys.all, 'recruitments'] as const,
  recruitmentList: (filtersKey?: string) =>
    filtersKey === undefined
      ? ([...geminiVisitingTrainingQueryKeys.recruitments(), 'list'] as const)
      : ([
          ...geminiVisitingTrainingQueryKeys.recruitments(),
          'list',
          'remote',
          filtersKey,
        ] as const),
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
  /** filtersKey를 생략하면 목록 prefix. invalidate는 이 prefix만 써야 필터별 캐시가 맞는다. */
  approvedList: (filtersKey?: string) =>
    filtersKey === undefined
      ? ([...geminiVisitingTrainingQueryKeys.approved(), 'list', 'remote'] as const)
      : ([...geminiVisitingTrainingQueryKeys.approved(), 'list', 'remote', filtersKey] as const),
  approvedDetail: (approvedTrainingId: string) =>
    [...geminiVisitingTrainingQueryKeys.approved(), 'detail', approvedTrainingId] as const,
  /** filtersKey를 생략하면 해당 연수 강사 신청 전체 prefix. */
  approvedInstructorApplications: (approvedTrainingId: string, filtersKey?: string) =>
    filtersKey === undefined
      ? ([
          ...geminiVisitingTrainingQueryKeys.approved(),
          'instructor-applications',
          approvedTrainingId,
        ] as const)
      : ([
          ...geminiVisitingTrainingQueryKeys.approved(),
          'instructor-applications',
          approvedTrainingId,
          filtersKey,
        ] as const),
  approvedInstructorApplicationDetail: (approvedTrainingId: string, applicationId?: string) =>
    applicationId === undefined
      ? ([
          ...geminiVisitingTrainingQueryKeys.approved(),
          'instructor-application-detail',
          approvedTrainingId,
        ] as const)
      : ([
          ...geminiVisitingTrainingQueryKeys.approved(),
          'instructor-application-detail',
          approvedTrainingId,
          applicationId,
        ] as const),
}
