export const generalApplicationsQueryKeys = {
  all: ['general-program-applications'] as const,
  organizationList: (programId: string, status?: string | null) =>
    [...generalApplicationsQueryKeys.all, 'organization', programId, status ?? 'all'] as const,
  organizationDetail: (applicationId: string) =>
    [...generalApplicationsQueryKeys.all, 'organization-detail', applicationId] as const,
  instructorList: (programId: string, status?: string | null) =>
    [...generalApplicationsQueryKeys.all, 'instructor', programId, status ?? 'all'] as const,
  instructorDetail: (applicationId: string) =>
    [...generalApplicationsQueryKeys.all, 'instructor-detail', applicationId] as const,
  individualLists: (programId: string) =>
    [...generalApplicationsQueryKeys.all, 'individual', programId] as const,
  individualList: (programId: string, status?: string | null) =>
    [...generalApplicationsQueryKeys.individualLists(programId), status ?? 'all'] as const,
  individualDetail: (applicationId: string) =>
    [...generalApplicationsQueryKeys.all, 'individual-detail', applicationId] as const,
  volunteerList: (programId: string, status?: string | null) =>
    [...generalApplicationsQueryKeys.all, 'volunteer', programId, status ?? 'all'] as const,
  volunteerDetail: (applicationId: string) =>
    [...generalApplicationsQueryKeys.all, 'volunteer-detail', applicationId] as const,
  /** form_response by application context (기관/강사/봉사 신청 상세 hydrate) */
  formByContext: (
    programId: string,
    contextType: string,
    contextId: string
  ) =>
    [
      ...generalApplicationsQueryKeys.all,
      'form-by-context',
      programId,
      contextType,
      contextId,
    ] as const,
  /** admin_comment by application target */
  commentsByTarget: (targetType: string, targetId: string) =>
    [
      ...generalApplicationsQueryKeys.all,
      'comments-by-target',
      targetType,
      targetId,
    ] as const,
}

export const generalProgramProgressQueryKeys = {
  all: ['general-program-progress'] as const,
  participants: (programId: string, participantType?: string | null) =>
    [...generalProgramProgressQueryKeys.all, 'participants', programId, participantType ?? 'all'] as const,
  institutions: (programId: string) =>
    [...generalProgramProgressQueryKeys.all, 'institutions', programId] as const,
  instructors: (programId: string) =>
    [...generalProgramProgressQueryKeys.all, 'instructors', programId] as const,
  volunteers: (programId: string) =>
    [...generalProgramProgressQueryKeys.all, 'volunteers', programId] as const,
  attendances: (programId: string, scheduleId: string) =>
    [...generalProgramProgressQueryKeys.all, 'attendances', programId, scheduleId] as const,
  schedules: (programId: string) =>
    [...generalProgramProgressQueryKeys.all, 'schedules', programId] as const,
  lectureReports: (programId: string) =>
    [...generalProgramProgressQueryKeys.all, 'lecture-reports', programId] as const,
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
}

export const generalInterviewSlotsQueryKeys = {
  all: ['general-interview-slots'] as const,
  list: (programId: string, from?: string, to?: string) =>
    [...generalInterviewSlotsQueryKeys.all, programId, from ?? '', to ?? ''] as const,
}
