export const generalApplicationsQueryKeys = {
  all: ['general-program-applications'] as const,
  organizationList: (programId: string, status?: string | null) =>
    [...generalApplicationsQueryKeys.all, 'organization', programId, status ?? 'all'] as const,
  organizationDetail: (applicationId: string) =>
    [...generalApplicationsQueryKeys.all, 'organization-detail', applicationId] as const,
  /** 동일 신청 id가 다른 프로그램 컨텍스트와 섞이지 않도록 programId 포함 (참여 기관 상세 등) */
  organizationDetailInProgram: (programId: string, applicationId: string) =>
    [
      ...generalApplicationsQueryKeys.all,
      'organization-detail',
      programId.trim(),
      applicationId.trim(),
    ] as const,
  organizationRequestedSchedules: (applicationId: string) =>
    [
      ...generalApplicationsQueryKeys.all,
      'organization-requested-schedules',
      applicationId,
    ] as const,
  /** 기간형 승인 오류 시 팝업 선택만 비운다. 신청 데이터는 담지 않는다. */
  organizationApproveSelectionReset: (applicationId: string) =>
    [
      ...generalApplicationsQueryKeys.all,
      'organization-approve-selection-reset',
      applicationId,
    ] as const,
  instructorList: (programId: string, status?: string | null) =>
    [...generalApplicationsQueryKeys.all, 'instructor', programId, status ?? 'all'] as const,
  instructorDetail: (applicationId: string) =>
    [...generalApplicationsQueryKeys.all, 'instructor-detail', applicationId] as const,
  instructorLectureAssignInstitutions: (programId: string) =>
    [
      ...generalApplicationsQueryKeys.all,
      'instructor-lecture-assign-institutions',
      programId,
    ] as const,
  individualLists: (programId: string) =>
    [...generalApplicationsQueryKeys.all, 'individual', programId] as const,
  individualList: (programId: string, status?: string | null) =>
    [...generalApplicationsQueryKeys.individualLists(programId), status ?? 'all'] as const,
  individualDetails: () => [...generalApplicationsQueryKeys.all, 'individual-detail'] as const,
  individualDetail: (applicationId: string) =>
    [...generalApplicationsQueryKeys.individualDetails(), applicationId] as const,
  volunteerList: (programId: string, status?: string | null) =>
    [...generalApplicationsQueryKeys.all, 'volunteer', programId, status ?? 'all'] as const,
  volunteerDetails: () => [...generalApplicationsQueryKeys.all, 'volunteer-detail'] as const,
  volunteerDetail: (applicationId: string) =>
    [...generalApplicationsQueryKeys.volunteerDetails(), applicationId] as const,
  /** form_response by application context (기관/강사/봉사 신청 상세 hydrate) */
  formByContext: (programId: string, contextType: string, contextId: string) =>
    [
      ...generalApplicationsQueryKeys.all,
      'form-by-context',
      programId,
      contextType,
      contextId,
    ] as const,
  formDetail: (responseId: string) =>
    [...generalApplicationsQueryKeys.all, 'form-detail', responseId] as const,
  /** admin_comment by application target */
  commentsByTarget: (targetType: string, targetId: string) =>
    [...generalApplicationsQueryKeys.all, 'comments-by-target', targetType, targetId] as const,
}

type OrganizationDetailCacheKey =
  | ReturnType<typeof generalApplicationsQueryKeys.organizationDetail>
  | ReturnType<typeof generalApplicationsQueryKeys.organizationDetailInProgram>

/** 기관 신청 상세 저장 후 갱신할 캐시 키. 진행 현황은 programId가 포함된 키를 읽는다. */
export function organizationApplicationDetailCacheKeys(
  applicationId: string,
  programId?: string
): OrganizationDetailCacheKey[] {
  const keys: OrganizationDetailCacheKey[] = [
    generalApplicationsQueryKeys.organizationDetail(applicationId),
  ]
  const trimmedProgramId = programId?.trim() ?? ''
  if (trimmedProgramId) {
    keys.push(
      generalApplicationsQueryKeys.organizationDetailInProgram(trimmedProgramId, applicationId)
    )
  }
  return keys
}

export const generalProgramProgressQueryKeys = {
  all: ['general-program-progress'] as const,
  participants: (programId: string, participantType?: string | null) =>
    [
      ...generalProgramProgressQueryKeys.all,
      'participants',
      programId,
      participantType ?? 'all',
    ] as const,
  institutions: (programId: string) =>
    [...generalProgramProgressQueryKeys.all, 'institutions', programId] as const,
  instructors: (programId: string) =>
    [...generalProgramProgressQueryKeys.all, 'instructors', programId] as const,
  volunteers: (programId: string) =>
    [...generalProgramProgressQueryKeys.all, 'volunteers', programId] as const,
  attendances: (programId: string, scheduleId: string) =>
    [...generalProgramProgressQueryKeys.all, 'attendances', programId, scheduleId] as const,
  programAttendancesBulk: (programId: string, scheduleIdsKey: string) =>
    [
      ...generalProgramProgressQueryKeys.all,
      'program-attendances-bulk',
      programId,
      scheduleIdsKey,
    ] as const,
  assignmentSubmissions: (programId: string) =>
    [...generalProgramProgressQueryKeys.all, 'assignment-submissions', programId] as const,
  schedules: (programId: string) =>
    [...generalProgramProgressQueryKeys.all, 'schedules', programId] as const,
  absenceReasons: (programId: string) =>
    [...generalProgramProgressQueryKeys.all, 'absence-reasons', programId] as const,
  lectureReports: (programId: string, instructorMemberId?: string | number | null) =>
    [
      ...generalProgramProgressQueryKeys.all,
      'lecture-reports',
      programId,
      instructorMemberId != null && instructorMemberId !== '' ? String(instructorMemberId) : 'all',
    ] as const,
  posts: (programId: string) =>
    [...generalProgramProgressQueryKeys.all, 'posts', programId] as const,
  surveys: (programId: string) =>
    [...generalProgramProgressQueryKeys.all, 'surveys', programId] as const,
  navigation: (programId: string) =>
    [...generalProgramProgressQueryKeys.all, 'navigation', programId] as const,
  mergeGroups: (programId: string) =>
    [...generalProgramProgressQueryKeys.all, 'organization-merge-groups', programId] as const,
  studentRoster: (organizationApplicationId: string) =>
    [...generalProgramProgressQueryKeys.all, 'student-roster', organizationApplicationId] as const,
  instructorAssignments: (programId: string) =>
    [...generalProgramProgressQueryKeys.all, 'instructor-assignments', programId] as const,
  educationScopes: () => [...generalProgramProgressQueryKeys.all, 'education-scope'] as const,
  educationScope: (programId: string, participantId: string) =>
    [...generalProgramProgressQueryKeys.educationScopes(), programId, participantId] as const,
  submissionTeam: (programId: string, participantId: string) =>
    [...generalProgramProgressQueryKeys.all, 'submission-team', programId, participantId] as const,
  submissionTeams: (programId: string) =>
    [...generalProgramProgressQueryKeys.all, 'submission-teams', programId] as const,
  instructorSettlements: (programId: string, instructorMemberId: string) =>
    [
      ...generalProgramProgressQueryKeys.all,
      'instructor-settlements',
      programId,
      instructorMemberId,
    ] as const,
  participantSettlements: (programId: string, participantId: string) =>
    [
      ...generalProgramProgressQueryKeys.all,
      'participant-settlements',
      programId,
      participantId,
    ] as const,
}

export const generalInterviewSlotsQueryKeys = {
  all: ['general-interview-slots'] as const,
  list: (programId: string, from?: string, to?: string) =>
    [...generalInterviewSlotsQueryKeys.all, programId, from ?? '', to ?? ''] as const,
}
