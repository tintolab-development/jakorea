export const generalProgramQueryKeys = {
  all: ['general-programs'] as const,
  list: (statusFilter: string | null) =>
    [...generalProgramQueryKeys.all, 'list', statusFilter ?? 'all'] as const,
  detail: (programId: string) =>
    [...generalProgramQueryKeys.all, 'detail', programId] as const,
}
