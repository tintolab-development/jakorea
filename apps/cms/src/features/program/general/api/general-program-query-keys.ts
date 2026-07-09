export const generalProgramQueryKeys = {
  all: ['general-programs'] as const,
  list: (statusFilter: string | null, tableFiltersKey = '') =>
    [...generalProgramQueryKeys.all, 'list', statusFilter ?? 'all', tableFiltersKey] as const,
  detail: (programId: string) =>
    [...generalProgramQueryKeys.all, 'detail', programId] as const,
  mutations: {
    create: () => [...generalProgramQueryKeys.all, 'mutation', 'create'] as const,
    update: (programId: string) =>
      [...generalProgramQueryKeys.all, 'mutation', 'update', programId] as const,
    delete: (programId: string) =>
      [...generalProgramQueryKeys.all, 'mutation', 'delete', programId] as const,
  },
}
