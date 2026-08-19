export const notificationsQueryKeys = {
  all: ['cms', 'notifications'] as const,
  alimtalkTemplates: {
    all: () => [...notificationsQueryKeys.all, 'alimtalk-templates'] as const,
    list: (searchParamsKey: string) =>
      [...notificationsQueryKeys.alimtalkTemplates.all(), 'list', searchParamsKey] as const,
  },
  alimtalkSendHistory: {
    all: () => [...notificationsQueryKeys.all, 'alimtalk-send-history'] as const,
    list: (searchParamsKey: string) =>
      [...notificationsQueryKeys.alimtalkSendHistory.all(), 'list', searchParamsKey] as const,
  },
} as const
