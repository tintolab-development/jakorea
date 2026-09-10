import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  getAlimtalkRecipientCandidates,
  getAlimtalkSenderProfiles,
  getAlimtalkTemplateVariables,
} from '@/features/notifications/api/alimtalk-send-service'
import type { NotificationTemplateVariablesQuery } from '@/features/notifications/api/adapters/alimtalk-send-batch-adapters'
import { getAlimtalkSendTemplatePicker } from '@/features/notifications/api/alimtalk-template-service'
import { notificationsQueryKeys } from '@/features/notifications/api/notifications-query-keys'
import { stableNotificationQueryKey } from '@/features/notifications/api/stable-query-key'

export function useAlimtalkSenderProfilesQuery(enabled = true) {
  return useQuery({
    queryKey: notificationsQueryKeys.alimtalkSend.senderProfiles(),
    queryFn: getAlimtalkSenderProfiles,
    enabled,
    staleTime: 60_000,
    retry: false,
  })
}

export function useAlimtalkSendTemplatePickerQuery(enabled = true) {
  return useQuery({
    queryKey: notificationsQueryKeys.alimtalkTemplates.picker(),
    queryFn: getAlimtalkSendTemplatePicker,
    enabled,
    staleTime: 30_000,
    retry: false,
  })
}

export function useAlimtalkRecipientCandidatesQuery(
  input: {
    programId?: number
    keyword?: string
    participantType?: string
    memberType?: string
    page?: number
    size?: number
  },
  enabled = true
) {
  const canFetch = enabled && input.programId != null && Number.isFinite(input.programId)
  const key = stableNotificationQueryKey({
    programId: input.programId,
    keyword: input.keyword,
    participantType: input.participantType,
    memberType: input.memberType,
    page: input.page,
    size: input.size,
  })
  return useQuery({
    queryKey: notificationsQueryKeys.alimtalkSend.recipients(key),
    queryFn: () =>
      getAlimtalkRecipientCandidates({
        ...input,
        programId: input.programId as number,
      }),
    enabled: canFetch,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    retry: false,
  })
}

export function useAlimtalkTemplateVariablesQuery(
  input: NotificationTemplateVariablesQuery = {},
  enabled = true
) {
  const key = stableNotificationQueryKey({ ...input })
  return useQuery({
    queryKey: notificationsQueryKeys.templateVariables.list(key),
    queryFn: () => getAlimtalkTemplateVariables(input),
    enabled,
    staleTime: 60_000,
    retry: false,
  })
}
