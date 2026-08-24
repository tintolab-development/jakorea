export const dataManagementQueryKeys = {
  all: ['cms', 'data-management'] as const,
  detailedPrograms: {
    all: () => [...dataManagementQueryKeys.all, 'detailed-programs'] as const,
    lists: () => [...dataManagementQueryKeys.detailedPrograms.all(), 'list'] as const,
    list: (searchParamsKey: string) =>
      [...dataManagementQueryKeys.detailedPrograms.lists(), searchParamsKey] as const,
    detail: (id: string) =>
      [...dataManagementQueryKeys.detailedPrograms.all(), 'detail', id] as const,
  },
  textbooks: {
    all: () => [...dataManagementQueryKeys.all, 'textbooks'] as const,
    lists: () => [...dataManagementQueryKeys.textbooks.all(), 'list'] as const,
    list: (searchParamsKey: string) =>
      [...dataManagementQueryKeys.textbooks.lists(), searchParamsKey] as const,
    detail: (id: string) => [...dataManagementQueryKeys.textbooks.all(), 'detail', id] as const,
    matches: (catalogKey: string) =>
      [...dataManagementQueryKeys.textbooks.all(), 'matches', catalogKey] as const,
    kitQuantities: () => [...dataManagementQueryKeys.textbooks.all(), 'kit-quantities'] as const,
  },
  sponsors: {
    all: () => [...dataManagementQueryKeys.all, 'sponsors'] as const,
    listAll: () => [...dataManagementQueryKeys.sponsors.all(), 'list'] as const,
    list: (searchParamsKey: string) =>
      [...dataManagementQueryKeys.sponsors.listAll(), searchParamsKey] as const,
    detail: (id: string) => [...dataManagementQueryKeys.sponsors.all(), 'detail', id] as const,
    yearlyBusinesses: (sponsorId: string) =>
      [...dataManagementQueryKeys.sponsors.all(), 'yearly-businesses', sponsorId] as const,
    options: () => [...dataManagementQueryKeys.sponsors.all(), 'options'] as const,
    programHistories: (sponsorId: string, paramsKey: string) =>
      [...dataManagementQueryKeys.sponsors.all(), 'program-histories', sponsorId, paramsKey] as const,
  },
} as const
