import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  getAlimtalkRecipientCandidates,
  getAlimtalkSenderProfiles,
  getAlimtalkTemplateVariables,
} from '@/features/notifications/api/alimtalk-send-service'
import { getAlimtalkSendTemplatePicker } from '@/features/notifications/api/alimtalk-template-service'
import { notificationsQueryKeys } from '@/features/notifications/api/notifications-query-keys'

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
  const key = JSON.stringify(input)
  return useQuery({
    queryKey: notificationsQueryKeys.alimtalkSend.recipients(key),
    queryFn: () => getAlimtalkRecipientCandidates(input),
    enabled,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    retry: false,
  })
}

export function useAlimtalkTemplateVariablesQuery(
  input: { category?: string; keyword?: string } = {},
  enabled = true
) {
  const key = JSON.stringify(input)
  return useQuery({
    queryKey: notificationsQueryKeys.alimtalkSend.variables(key),
    queryFn: () => getAlimtalkTemplateVariables(input),
    enabled,
    staleTime: 60_000,
    retry: false,
  })
}
