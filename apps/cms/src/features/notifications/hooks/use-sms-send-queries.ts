import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getSmsSendTemplatePicker } from '@/features/notifications/api/sms-template-service'
import {
  getSmsRecipientCandidates,
  getSmsSenderProfiles,
  getSmsTemplateVariables,
} from '@/features/notifications/api/sms-send-service'
import type { NotificationTemplateVariablesQuery } from '@/features/notifications/api/adapters/alimtalk-send-batch-adapters'
import { notificationsQueryKeys } from '@/features/notifications/api/notifications-query-keys'
import { stableNotificationQueryKey } from '@/features/notifications/api/stable-query-key'

export function useSmsSenderProfilesQuery(enabled = true) {
  return useQuery({
    queryKey: notificationsQueryKeys.smsSend.senderProfiles(),
    queryFn: getSmsSenderProfiles,
    enabled,
    staleTime: 60_000,
    retry: false,
  })
}

export function useSmsSendTemplatePickerQuery(enabled = true) {
  return useQuery({
    queryKey: notificationsQueryKeys.smsTemplates.picker(),
    queryFn: getSmsSendTemplatePicker,
    enabled,
    staleTime: 30_000,
    retry: false,
  })
}

export function useSmsRecipientCandidatesQuery(
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
    queryKey: notificationsQueryKeys.smsSend.recipients(key),
    queryFn: () =>
      getSmsRecipientCandidates({
        ...input,
        programId: input.programId as number,
      }),
    enabled: canFetch,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    retry: false,
  })
}

export function useSmsTemplateVariablesQuery(
  input: NotificationTemplateVariablesQuery = {},
  enabled = true
) {
  const key = stableNotificationQueryKey({ ...input })
  return useQuery({
    queryKey: notificationsQueryKeys.templateVariables.list(key),
    queryFn: () => getSmsTemplateVariables(input),
    enabled,
    staleTime: 60_000,
    retry: false,
  })
}
