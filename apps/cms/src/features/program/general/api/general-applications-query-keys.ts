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
}
