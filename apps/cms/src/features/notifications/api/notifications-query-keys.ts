export const notificationsQueryKeys = {
  all: ['cms', 'notifications'] as const,
  alimtalkTemplates: {
    all: () => [...notificationsQueryKeys.all, 'alimtalk-templates'] as const,
    list: (searchParamsKey: string) =>
      [...notificationsQueryKeys.alimtalkTemplates.all(), 'list', searchParamsKey] as const,
    tree: (searchParamsKey: string) =>
      [...notificationsQueryKeys.alimtalkTemplates.all(), 'tree', searchParamsKey] as const,
    detail: (templateId: string) =>
      [...notificationsQueryKeys.alimtalkTemplates.all(), 'detail', templateId] as const,
    preview: (templateId: string) =>
      [...notificationsQueryKeys.alimtalkTemplates.all(), 'preview', templateId] as const,
    picker: () => [...notificationsQueryKeys.alimtalkTemplates.all(), 'picker'] as const,
  },
  alimtalkSend: {
    all: () => [...notificationsQueryKeys.all, 'alimtalk-send'] as const,
    senderProfiles: () =>
      [...notificationsQueryKeys.alimtalkSend.all(), 'sender-profiles'] as const,
    recipients: (key: string) =>
      [...notificationsQueryKeys.alimtalkSend.all(), 'recipients', key] as const,
    variables: (key: string) =>
      [...notificationsQueryKeys.alimtalkSend.all(), 'variables', key] as const,
  },
  alimtalkSendHistory: {
    all: () => [...notificationsQueryKeys.all, 'alimtalk-send-history'] as const,
    list: (searchParamsKey: string) =>
      [...notificationsQueryKeys.alimtalkSendHistory.all(), 'list', searchParamsKey] as const,
    detail: (deliveryId: string) =>
      [...notificationsQueryKeys.alimtalkSendHistory.all(), 'detail', deliveryId] as const,
  },
} as const
