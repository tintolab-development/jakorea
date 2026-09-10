export const notificationsQueryKeys = {
  all: ['cms', 'notifications'] as const,
  sendPrograms: {
    all: () => [...notificationsQueryKeys.all, 'send-programs'] as const,
    picker: () => [...notificationsQueryKeys.sendPrograms.all(), 'picker'] as const,
  },
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
    /** @deprecated use templateVariables.list */
    variables: (key: string) => notificationsQueryKeys.templateVariables.list(key),
  },
  alimtalkSendHistory: {
    all: () => [...notificationsQueryKeys.all, 'alimtalk-send-history'] as const,
    list: (searchParamsKey: string) =>
      [...notificationsQueryKeys.alimtalkSendHistory.all(), 'list', searchParamsKey] as const,
    detail: (deliveryId: string) =>
      [...notificationsQueryKeys.alimtalkSendHistory.all(), 'detail', deliveryId] as const,
  },
  mailTemplates: {
    all: () => [...notificationsQueryKeys.all, 'mail-templates'] as const,
    tree: (searchParamsKey: string) =>
      [...notificationsQueryKeys.mailTemplates.all(), 'tree', searchParamsKey] as const,
    detail: (templateId: string) =>
      [...notificationsQueryKeys.mailTemplates.all(), 'detail', templateId] as const,
    preview: (templateId: string) =>
      [...notificationsQueryKeys.mailTemplates.all(), 'preview', templateId] as const,
    picker: () => [...notificationsQueryKeys.mailTemplates.all(), 'picker'] as const,
  },
  /**
   * GET …/template-variables — 채널 공통 카탈로그.
   * mail/sms/alimtalk이 같은 key를 쓰면 중복 네트워크를 피한다.
   */
  templateVariables: {
    all: () => [...notificationsQueryKeys.all, 'template-variables'] as const,
    list: (key: string) =>
      [...notificationsQueryKeys.templateVariables.all(), 'list', key] as const,
  },
  mailSend: {
    all: () => [...notificationsQueryKeys.all, 'mail-send'] as const,
    senderProfiles: () => [...notificationsQueryKeys.mailSend.all(), 'sender-profiles'] as const,
    recipients: (key: string) =>
      [...notificationsQueryKeys.mailSend.all(), 'recipients', key] as const,
    /** @deprecated use templateVariables.list — 하위 호환용 별칭 */
    variables: (key: string) => notificationsQueryKeys.templateVariables.list(key),
  },
  mailSendHistory: {
    all: () => [...notificationsQueryKeys.all, 'mail-send-history'] as const,
    list: (searchParamsKey: string) =>
      [...notificationsQueryKeys.mailSendHistory.all(), 'list', searchParamsKey] as const,
    detail: (deliveryId: string) =>
      [...notificationsQueryKeys.mailSendHistory.all(), 'detail', deliveryId] as const,
  },
  smsTemplates: {
    all: () => [...notificationsQueryKeys.all, 'sms-templates'] as const,
    tree: (searchParamsKey: string) =>
      [...notificationsQueryKeys.smsTemplates.all(), 'tree', searchParamsKey] as const,
    detail: (templateId: string) =>
      [...notificationsQueryKeys.smsTemplates.all(), 'detail', templateId] as const,
    preview: (templateId: string) =>
      [...notificationsQueryKeys.smsTemplates.all(), 'preview', templateId] as const,
    picker: () => [...notificationsQueryKeys.smsTemplates.all(), 'picker'] as const,
  },
  smsSend: {
    all: () => [...notificationsQueryKeys.all, 'sms-send'] as const,
    senderProfiles: () => [...notificationsQueryKeys.smsSend.all(), 'sender-profiles'] as const,
    recipients: (key: string) =>
      [...notificationsQueryKeys.smsSend.all(), 'recipients', key] as const,
    /** @deprecated use templateVariables.list */
    variables: (key: string) => notificationsQueryKeys.templateVariables.list(key),
  },
  smsSendHistory: {
    all: () => [...notificationsQueryKeys.all, 'sms-send-history'] as const,
    list: (searchParamsKey: string) =>
      [...notificationsQueryKeys.smsSendHistory.all(), 'list', searchParamsKey] as const,
    detail: (deliveryId: string) =>
      [...notificationsQueryKeys.smsSendHistory.all(), 'detail', deliveryId] as const,
  },
} as const
