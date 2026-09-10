import { normalizeKoreanPhoneDigits } from '@/shared/utils/phone-validation'
import {
  mapSenderProfileOptions,
  type AlimtalkSenderProfileOption,
} from '@/features/notifications/api/adapters/alimtalk-sender-adapters'
import {
  mapTemplateVariablesCatalog,
  pickNonEmptySendVariables,
  toTemplateVariablesRequestParams,
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
import {
  buildSmsSendCreateRequest,
  buildSmsSendPayload,
} from '@/features/notifications/model/sms-send/payload'
import type { SmsSendDraft, SmsSendRecipient } from '@/features/notifications/model/sms-send/types'
import { applyNotificationSendBodySnapshot } from '@/features/notifications/model/shared/send-body-snapshot'
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
  if (!shouldUseSmsSendRemoteApi()) return []

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
  return profiles.find(profile => normalizeKoreanPhoneDigits(profile.senderKey) === normalized)
    ?.profileId
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
      items: [],
      total: 0,
      page,
      size,
      totalPages: 1,
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
  const dto = await fetchTemplateVariablesRemote(toTemplateVariablesRequestParams(input))
  return mapTemplateVariablesCatalog(dto)
}

/**
 * 문자 발송 — `POST /api/admin/notification-send-batches`
 * - 발송 편집본은 titleTemplate/contentTemplate 스냅샷으로 전송 (등록 템플릿 PATCH 금지)
 * - 필수 변수 누락은 BE fail-closed
 * - recipient.variables로 DIRECT·마스킹되지 않은 값 보완
 */
export async function submitSmsSend(input: {
  draft: SmsSendDraft
  templateDisplayName?: string
  templateCategoryId?: string | null
  templateBaseline?: { subject: string; bodyText: string; messageType?: string }
  idempotencyKey: string
  senderProfileId?: number
  variables?: Record<string, unknown>
}): Promise<void> {
  const {
    templateDisplayName,
    templateBaseline,
    idempotencyKey,
    senderProfileId,
    variables,
  } = input
  assertSmsSendRemoteReady()
  const draft = buildSmsSendPayload(input.draft)
  const numericTemplateId =
    draft.templateId && /^\d+$/.test(draft.templateId.trim())
      ? Number(draft.templateId.trim())
      : null

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
  const batchVariables = pickNonEmptySendVariables(variables)
  if (batchVariables) body.variables = batchVariables

  applyNotificationSendBodySnapshot(body, {
    channel: 'SMS',
    title: draft.messageType === 'SMS' ? '' : draft.subject,
    content: draft.bodyText,
    baseline: templateBaseline
      ? {
          title: draft.messageType === 'SMS' ? '' : templateBaseline.subject,
          content: templateBaseline.bodyText,
        }
      : null,
  })

  // 발송 화면 삽입 #{변수}가 omit되면 등록 템플릿만 나감. 본문·제목 있으면 스냅샷 강제.
  if (draft.bodyText.trim()) {
    body.contentTemplate = draft.bodyText
  }
  if (draft.messageType !== 'SMS' && draft.subject.trim()) {
    body.titleTemplate = draft.subject.trim().slice(0, 40)
  }

  await createSendBatchRemote(body, idempotencyKey)
}
