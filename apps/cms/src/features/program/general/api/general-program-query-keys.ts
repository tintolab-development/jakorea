export const generalProgramQueryKeys = {
  all: ['general-programs'] as const,
  lists: () => [...generalProgramQueryKeys.all, 'list'] as const,
  list: (statusFilter: string | null, tableFiltersKey = '') =>
    [...generalProgramQueryKeys.lists(), statusFilter ?? 'all', tableFiltersKey] as const,
  /** 상단 4카드 위젯 건수 — list 무효화와 함께 갱신 */
  overviewStages: () => [...generalProgramQueryKeys.all, 'overview-stages'] as const,
  detail: (programId: string) => [...generalProgramQueryKeys.all, 'detail', programId] as const,
  materials: (programId: string) =>
    [...generalProgramQueryKeys.all, 'materials', programId] as const,
  materialCandidates: (programId: string) =>
    [...generalProgramQueryKeys.all, 'material-candidates', programId] as const,
  sponsorAssignments: (programId: string) =>
    [...generalProgramQueryKeys.all, 'sponsor-assignments', programId] as const,
  navigation: (programId: string) =>
    [...generalProgramQueryKeys.all, 'navigation', programId] as const,
  posts: (programId: string) => [...generalProgramQueryKeys.all, 'posts', programId] as const,
  postDetail: (programId: string, postId: string) =>
    [...generalProgramQueryKeys.all, 'posts', programId, 'detail', postId] as const,
  postComments: (programId: string, postId: string) =>
    [...generalProgramQueryKeys.all, 'posts', programId, 'comments', postId] as const,
  postReactions: (programId: string, postId: string) =>
    [...generalProgramQueryKeys.all, 'posts', programId, 'reactions', postId] as const,
  postAttachments: (programId: string, postId: string) =>
    [...generalProgramQueryKeys.all, 'posts', programId, 'attachments', postId] as const,
  postReads: (programId: string, postId: string) =>
    [...generalProgramQueryKeys.all, 'posts', programId, 'reads', postId] as const,
  postFiles: (programId: string) =>
    [...generalProgramQueryKeys.all, 'posts', programId, 'files'] as const,
  managersRoot: (programId: string) =>
    [...generalProgramQueryKeys.all, 'managers', programId] as const,
  managers: (programId: string, filtersKey = '') =>
    [...generalProgramQueryKeys.managersRoot(programId), filtersKey] as const,
  managerCandidates: (keyword = '') =>
    [...generalProgramQueryKeys.all, 'manager-candidates', keyword] as const,
  surveys: (programId: string) => [...generalProgramQueryKeys.all, 'surveys', programId] as const,
  surveyDisplayTitles: (programId: string, versionIdsKey: string) =>
    [...generalProgramQueryKeys.all, 'survey-display-titles', programId, versionIdsKey] as const,
  formBindings: (programId: string) =>
    [...generalProgramQueryKeys.all, 'form-bindings', programId] as const,
  /** 모집별 신청 건수 선행 검증 — form-binding 저장 직전에 신선하게 조회한다. */
  applicationCounts: (programId: string) =>
    [...generalProgramQueryKeys.all, 'application-counts', programId] as const,
  schedules: (programId: string) =>
    [...generalProgramQueryKeys.all, 'schedules', programId] as const,
  /** 프로그램 공통 교육 예정 슬롯 — GET education-slots (schedules 캐시와 분리) */
  educationSlots: (programId: string) =>
    [...generalProgramQueryKeys.all, 'education-slots', programId] as const,
  surveyResponses: (programId: string, templateVersionId: string, bindingId = '') =>
    [
      ...generalProgramQueryKeys.all,
      'survey-responses',
      programId,
      templateVersionId,
      bindingId,
    ] as const,
  surveyResponseDetail: (programId: string, templateVersionId: string, formResponseId: string) =>
    [
      ...generalProgramQueryKeys.all,
      'survey-response-detail',
      programId,
      templateVersionId,
      formResponseId,
    ] as const,
  surveySummary: (programId: string, templateVersionId: string, bindingId = '') =>
    [
      ...generalProgramQueryKeys.all,
      'survey-summary',
      programId,
      templateVersionId,
      bindingId,
    ] as const,
  mutations: {
    create: () => [...generalProgramQueryKeys.all, 'mutation', 'create'] as const,
    update: (programId: string) =>
      [...generalProgramQueryKeys.all, 'mutation', 'update', programId] as const,
    delete: (programId: string) =>
      [...generalProgramQueryKeys.all, 'mutation', 'delete', programId] as const,
  },
}
