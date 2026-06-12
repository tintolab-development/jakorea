export const dataManagementQueryKeys = {
  all: ['cms', 'data-management'] as const,
  detailedPrograms: {
    all: () => [...dataManagementQueryKeys.all, 'detailed-programs'] as const,
    list: (searchParamsKey: string) =>
      [...dataManagementQueryKeys.detailedPrograms.all(), 'list', searchParamsKey] as const,
    detail: (id: string) =>
      [...dataManagementQueryKeys.detailedPrograms.all(), 'detail', id] as const,
  },
  textbooks: {
    all: () => [...dataManagementQueryKeys.all, 'textbooks'] as const,
    list: (searchParamsKey: string) =>
      [...dataManagementQueryKeys.textbooks.all(), 'list', searchParamsKey] as const,
    detail: (id: string) => [...dataManagementQueryKeys.textbooks.all(), 'detail', id] as const,
  },
  sponsors: {
    all: () => [...dataManagementQueryKeys.all, 'sponsors'] as const,
    list: (searchParamsKey: string) =>
      [...dataManagementQueryKeys.sponsors.all(), 'list', searchParamsKey] as const,
    detail: (id: string) => [...dataManagementQueryKeys.sponsors.all(), 'detail', id] as const,
  },
} as const
