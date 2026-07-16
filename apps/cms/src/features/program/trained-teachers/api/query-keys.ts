export const trainedTeacherQueryKeys = {
  all: ['cms', 'programs', 'trained-teachers'] as const,
  lists: () => [...trainedTeacherQueryKeys.all, 'list'] as const,
  list: (filtersKey = '') => [...trainedTeacherQueryKeys.lists(), filtersKey] as const,
  details: () => [...trainedTeacherQueryKeys.all, 'detail'] as const,
  detail: (programId: string) =>
    [...trainedTeacherQueryKeys.details(), programId] as const,
  organizationApplicationsRoot: () =>
    [...trainedTeacherQueryKeys.all, 'organization-applications'] as const,
  organizationApplications: (programId: string) =>
    [...trainedTeacherQueryKeys.organizationApplicationsRoot(), programId] as const,
  organizationApplication: (programId: string, applicationId: string) =>
    [
      ...trainedTeacherQueryKeys.organizationApplications(programId),
      'item',
      applicationId,
    ] as const,
  educationJournalsRoot: () =>
    [...trainedTeacherQueryKeys.all, 'education-journals'] as const,
  educationJournals: (programId: string, organizationApplicationId: string) =>
    [
      ...trainedTeacherQueryKeys.educationJournalsRoot(),
      programId,
      organizationApplicationId,
    ] as const,
  participatingInstitutions: (programId: string) =>
    [...trainedTeacherQueryKeys.all, 'participating-institutions', programId] as const,
  performanceSummary: (programId: string) =>
    [...trainedTeacherQueryKeys.all, 'performance-summary', programId] as const,
  mutations: {
    create: () => [...trainedTeacherQueryKeys.all, 'mutation', 'create'] as const,
    update: (programId: string) =>
      [...trainedTeacherQueryKeys.all, 'mutation', 'update', programId] as const,
    delete: (programId: string) =>
      [...trainedTeacherQueryKeys.all, 'mutation', 'delete', programId] as const,
  },
}
