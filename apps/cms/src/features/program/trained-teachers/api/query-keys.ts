export const trainedTeacherQueryKeys = {
  all: ['cms', 'programs', 'trained-teachers'] as const,
  overviewStages: () => [...trainedTeacherQueryKeys.all, 'overview-stages'] as const,
  lists: () => [...trainedTeacherQueryKeys.all, 'list'] as const,
  list: (filtersKey = '') => [...trainedTeacherQueryKeys.lists(), filtersKey] as const,
  details: () => [...trainedTeacherQueryKeys.all, 'detail'] as const,
  detail: (programId: string) =>
    [...trainedTeacherQueryKeys.details(), programId] as const,
  organizationApplicationsRoot: () =>
    [...trainedTeacherQueryKeys.all, 'organization-applications'] as const,
  organizationApplicationsProgram: (programId: string) =>
    [...trainedTeacherQueryKeys.organizationApplicationsRoot(), programId] as const,
  organizationApplications: (programId: string, filtersKey = '') =>
    [
      ...trainedTeacherQueryKeys.organizationApplicationsProgram(programId),
      filtersKey,
    ] as const,
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
  educationJournalZipJob: (
    programId: string,
    organizationApplicationId: string,
    jobId: number
  ) =>
    [
      ...trainedTeacherQueryKeys.educationJournals(programId, organizationApplicationId),
      'zip-job',
      jobId,
    ] as const,
  educationCompletionsRoot: () =>
    [...trainedTeacherQueryKeys.all, 'education-completions'] as const,
  educationCompletionsProgram: (programId: string) =>
    [...trainedTeacherQueryKeys.educationCompletionsRoot(), programId] as const,
  educationCompletions: (programId: string, organizationApplicationId = '') =>
    [
      ...trainedTeacherQueryKeys.educationCompletionsProgram(programId),
      organizationApplicationId,
    ] as const,
  participatingInstitutionsProgram: (programId: string) =>
    [...trainedTeacherQueryKeys.all, 'participating-institutions', programId] as const,
  participatingInstitutions: (programId: string, filtersKey = '') =>
    [
      ...trainedTeacherQueryKeys.participatingInstitutionsProgram(programId),
      filtersKey,
    ] as const,
  performanceSummary: (programId: string) =>
    [...trainedTeacherQueryKeys.all, 'performance-summary', programId] as const,
  programSchedules: (programId: string) =>
    [...trainedTeacherQueryKeys.all, 'program-schedules', programId] as const,
  mutations: {
    create: () => [...trainedTeacherQueryKeys.all, 'mutation', 'create'] as const,
    update: (programId: string) =>
      [...trainedTeacherQueryKeys.all, 'mutation', 'update', programId] as const,
    delete: (programId: string) =>
      [...trainedTeacherQueryKeys.all, 'mutation', 'delete', programId] as const,
  },
}
