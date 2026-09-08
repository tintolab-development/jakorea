import { normalizeKoreanPhoneDigits } from '@/shared/utils/phone-validation'
import { mapSenderProfileOptions, type AlimtalkSenderProfileOption } from '@/features/notifications/api/adapters/alimtalk-sender-adapters'
import {
  mapTemplateVariablesCatalog,
  type AlimtalkTemplateVariable,
  type NotificationTemplateVariablesQuery,
} from '@/features/notifications/api/adapters/alimtalk-send-batch-adapters'
import { mapSmsRecipientCandidates } from '@/features/notifications/api/adapters/sms-send-adapters'
import { SMS_API_CHANNEL_TYPE } from '@/features/notifications/api/adapters/sms-channel'
import {
  createSendBatchRemote,
  fetchRecipientCandidatesRemote,
  fetchSenderProfilesRemote,
  fetchTemplateVariablesRemote,
} from '@/features/notifications/api/notifications-api-client'
import { SMS_SEND_RECIPIENT_MOCK } from '@/features/notifications/model/sms-send/mock'
import {
  buildSmsSendCreateRequest,
  buildSmsSendPayload,
} from '@/features/notifications/model/sms-send/payload'
import type { SmsSendDraft, SmsSendRecipient } from '@/features/notifications/model/sms-send/types'
import {
  createSmsSendHistoryRowsFromDraft,
  prependSmsSendHistoryMockRows,
} from '@/features/notifications/model/sms-send-history/session-store'
import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'

export type SmsSenderProfileOption = AlimtalkSenderProfileOption

function assertSmsSendRemoteReady(): void {
  if (!isRealApiModuleEnabled('notifications')) {
    throw new Error(
      '알림 API가 활성화되지 않았습니다. VITE_REAL_API_MODULES에 notifications를 추가해 주세요.'
    )
  }
  if (!hasRemoteAdminJwt()) {
    throw new Error('문자 발송은 관리자 로그인 후 이용할 수 있습니다.')
  }
}

export function shouldUseSmsSendRemoteApi(): boolean {
  return isRealApiModuleEnabled('notifications') && hasRemoteAdminJwt()
}

export async function getSmsSenderProfiles(): Promise<SmsSenderProfileOption[]> {
  if (!shouldUseSmsSendRemoteApi()) {
    return [
      {
        profileId: 1,
        senderKey: '027832367',
        displayName: '02-783-2367',
      },
    ]
  }

  const dto = await fetchSenderProfilesRemote({
    channelType: SMS_API_CHANNEL_TYPE,
    useYn: true,
  })
  return mapSenderProfileOptions(dto.items)
}

export function resolveSmsSenderProfileId(
  profiles: SmsSenderProfileOption[],
  senderPhone: string
): number | undefined {
  const normalized = normalizeKoreanPhoneDigits(senderPhone)
  if (!normalized) return undefined
  return profiles.find(profile => normalizeKoreanPhoneDigits(profile.senderKey) === normalized)?.profileId
}

export async function getSmsRecipientCandidates(input: {
  programId: number
  keyword?: string
  participantType?: string
  memberType?: string
  page?: number
  size?: number
}): Promise<{
  items: SmsSendRecipient[]
  total: number
  page: number
  size: number
  totalPages: number
}> {
  const size = input.size ?? 50
  const page = input.page ?? 0

  if (!shouldUseSmsSendRemoteApi()) {
    return {
      items: SMS_SEND_RECIPIENT_MOCK,
      total: SMS_SEND_RECIPIENT_MOCK.length,
      page,
      size,
      totalPages: Math.max(Math.ceil(SMS_SEND_RECIPIENT_MOCK.length / size), 1),
    }
  }

  const dto = await fetchRecipientCandidatesRemote({
    channelType: SMS_API_CHANNEL_TYPE,
    programId: input.programId,
    keyword: input.keyword,
    participantType: input.participantType,
    memberType: input.memberType,
    page,
    size,
  })
  const total = dto.totalElements ?? dto.items?.length ?? 0
  const resolvedSize = dto.size ?? size
  return {
    items: mapSmsRecipientCandidates(dto.items),
    total,
    page: dto.page ?? page,
    size: resolvedSize,
    totalPages: dto.totalPages ?? Math.max(Math.ceil(total / (resolvedSize || 50)), 1),
  }
}

export async function getSmsTemplateVariables(
  input: NotificationTemplateVariablesQuery = {}
): Promise<AlimtalkTemplateVariable[]> {
  if (!shouldUseSmsSendRemoteApi()) return []
  const dto = await fetchTemplateVariablesRemote({
    category: input.category,
    keyword: input.keyword,
    programId: input.programId,
    participantType: input.participantType,
    memberType: input.memberType,
  })
  return mapTemplateVariablesCatalog(dto)
}

export async function submitSmsSend(input: {
  draft: SmsSendDraft
  templateDisplayName?: string
  idempotencyKey: string
  senderProfileId?: number
}): Promise<{ mode: 'remote' | 'mock' }> {
  const { templateDisplayName, idempotencyKey, senderProfileId } = input
  const draft = buildSmsSendPayload(input.draft)
  const numericTemplateId =
    draft.templateId && /^\d+$/.test(draft.templateId.trim()) ? Number(draft.templateId.trim()) : null

  if (shouldUseSmsSendRemoteApi()) {
    assertSmsSendRemoteReady()
    if (numericTemplateId == null) {
      throw new Error('문자 발송에는 서버에 등록된 템플릿이 필요합니다.')
    }

    let resolvedSenderProfileId = senderProfileId
    if (resolvedSenderProfileId == null && draft.senderPhone.trim()) {
      const profiles = await getSmsSenderProfiles()
      resolvedSenderProfileId = resolveSmsSenderProfileId(profiles, draft.senderPhone)
    }

    const body = buildSmsSendCreateRequest({
      draft,
      templateId: numericTemplateId,
      senderKey: normalizeKoreanPhoneDigits(draft.senderPhone) || draft.senderPhone.trim(),
      senderProfileId: resolvedSenderProfileId,
    })
    if (templateDisplayName?.trim()) {
      body.batchName = templateDisplayName.trim().slice(0, 200)
    }

    await createSendBatchRemote(body, idempotencyKey)
    return { mode: 'remote' }
  }

  const rows = createSmsSendHistoryRowsFromDraft(draft, templateDisplayName)
  prependSmsSendHistoryMockRows(rows)
  return { mode: 'mock' }
}
