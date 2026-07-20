export const generalApplicationsQueryKeys = {
  all: ['general-program-applications'] as const,
  organizationList: (programId: string, status?: string | null) =>
    [...generalApplicationsQueryKeys.all, 'organization', programId, status ?? 'all'] as const,
  instructorList: (programId: string, status?: string | null) =>
    [...generalApplicationsQueryKeys.all, 'instructor', programId, status ?? 'all'] as const,
  individualList: (programId: string, status?: string | null) =>
    [...generalApplicationsQueryKeys.all, 'individual', programId, status ?? 'all'] as const,
  volunteerList: (programId: string, status?: string | null) =>
    [...generalApplicationsQueryKeys.all, 'volunteer', programId, status ?? 'all'] as const,
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
  posts: (programId: string) =>
    [...generalProgramProgressQueryKeys.all, 'posts', programId] as const,
  surveys: (programId: string) =>
    [...generalProgramProgressQueryKeys.all, 'surveys', programId] as const,
  navigation: (programId: string) =>
    [...generalProgramProgressQueryKeys.all, 'navigation', programId] as const,
}
