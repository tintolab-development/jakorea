import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  getMailRecipientCandidates,
  getMailSenderProfiles,
  getMailTemplateVariables,
} from '@/features/notifications/api/mail-send-service'
import type { NotificationTemplateVariablesQuery } from '@/features/notifications/api/adapters/alimtalk-send-batch-adapters'
import { notificationsQueryKeys } from '@/features/notifications/api/notifications-query-keys'
import { stableNotificationQueryKey } from '@/features/notifications/api/stable-query-key'

export function useMailSenderProfilesQuery(enabled = true) {
  return useQuery({
    queryKey: notificationsQueryKeys.mailSend.senderProfiles(),
    queryFn: getMailSenderProfiles,
    enabled,
    staleTime: 60_000,
    retry: false,
  })
}

export function useMailRecipientCandidatesQuery(
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
    queryKey: notificationsQueryKeys.mailSend.recipients(key),
    queryFn: () =>
      getMailRecipientCandidates({
        ...input,
        programId: input.programId as number,
      }),
    enabled: canFetch,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    retry: false,
  })
}

export function useMailTemplateVariablesQuery(
  input: NotificationTemplateVariablesQuery = {},
  enabled = true
) {
  const key = stableNotificationQueryKey({ ...input })
  return useQuery({
    queryKey: notificationsQueryKeys.templateVariables.list(key),
    queryFn: () => getMailTemplateVariables(input),
    enabled,
    staleTime: 60_000,
    retry: false,
  })
}
