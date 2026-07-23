export const generalProgramQueryKeys = {
  all: ['general-programs'] as const,
  list: (statusFilter: string | null, tableFiltersKey = '') =>
    [...generalProgramQueryKeys.all, 'list', statusFilter ?? 'all', tableFiltersKey] as const,
  /** 상단 4카드 위젯 건수 — list 무효화와 함께 갱신 */
  overviewStages: () => [...generalProgramQueryKeys.all, 'overview-stages'] as const,
  detail: (programId: string) =>
    [...generalProgramQueryKeys.all, 'detail', programId] as const,
  navigation: (programId: string) =>
    [...generalProgramQueryKeys.all, 'navigation', programId] as const,
  posts: (programId: string) => [...generalProgramQueryKeys.all, 'posts', programId] as const,
  managers: (programId: string) =>
    [...generalProgramQueryKeys.all, 'managers', programId] as const,
  managerCandidates: () => [...generalProgramQueryKeys.all, 'manager-candidates'] as const,
  surveys: (programId: string) => [...generalProgramQueryKeys.all, 'surveys', programId] as const,
  formBindings: (programId: string) =>
    [...generalProgramQueryKeys.all, 'form-bindings', programId] as const,
  surveyResponses: (programId: string, templateVersionId: string) =>
    [...generalProgramQueryKeys.all, 'survey-responses', programId, templateVersionId] as const,
  surveyResponseDetail: (
    programId: string,
    templateVersionId: string,
    formResponseId: string
  ) =>
    [
      ...generalProgramQueryKeys.all,
      'survey-response-detail',
      programId,
      templateVersionId,
      formResponseId,
    ] as const,
  surveySummary: (programId: string, templateVersionId: string) =>
    [...generalProgramQueryKeys.all, 'survey-summary', programId, templateVersionId] as const,
  mutations: {
    create: () => [...generalProgramQueryKeys.all, 'mutation', 'create'] as const,
    update: (programId: string) =>
      [...generalProgramQueryKeys.all, 'mutation', 'update', programId] as const,
    delete: (programId: string) =>
      [...generalProgramQueryKeys.all, 'mutation', 'delete', programId] as const,
  },
}
