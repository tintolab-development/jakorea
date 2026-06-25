export const notificationsQueryKeys = {
  all: ['cms', 'notifications'] as const,
  alimtalkTemplates: {
    all: () => [...notificationsQueryKeys.all, 'alimtalk-templates'] as const,
    list: (searchParamsKey: string) =>
      [...notificationsQueryKeys.alimtalkTemplates.all(), 'list', searchParamsKey] as const,
  },
} as const
