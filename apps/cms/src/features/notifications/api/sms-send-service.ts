import type { CreateRequest } from '@/shared/api/generated/notifications/schemas'
import { normalizeKoreanPhoneDigits } from '@/shared/utils/phone-validation'
import {
  mapSenderProfileOptions,
  type AlimtalkSenderProfileOption,
} from '@/features/notifications/api/adapters/alimtalk-sender-adapters'
import {
  mapTemplateVariablesCatalog,
  pickNonEmptySendVariables,
  toTemplateVariablesRequestParams,
  type NotificationTemplateVariablesCatalogMapped,
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
import type { AlimtalkVariableCatalogEntry } from '@/features/notifications/model/alimtalk-send/recipient-variables'
import {
  buildSmsSendCreateRequest,
  buildSmsSendPayload,
  validateSmsSendDraft,
} from '@/features/notifications/model/sms-send/payload'
import { validateSmsSendVariables } from '@/features/notifications/model/sms-send/validate-send'
import type { SmsSendDraft, SmsSendRecipient } from '@/features/notifications/model/sms-send/types'
import { applyNotificationSendBodySnapshot } from '@/features/notifications/model/shared/send-body-snapshot'
import { NOTIFICATION_SEND_BATCH_RECIPIENT_LIMIT } from '@/features/notifications/model/send-program-id'
import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'

export type SmsSenderProfileOption = AlimtalkSenderProfileOption

function assertSmsSendRemoteReady(): void {
  if (!isRealApiModuleEnabled('notifications')) {
    throw new Error(
      '알림 API가 활성화되지 않았습니다. VITE_API_SERVER(또는 VITE_API_BASE_URL)로 백엔드를 설정해 주세요.'
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
  /** 생략 시 전체 회원 후보 (대상 프로그램 미선택) */
  programId?: number
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
  const size = input.size ?? 20
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
    ...(input.programId != null && Number.isFinite(input.programId)
      ? { programId: input.programId }
      : {}),
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
    totalPages: dto.totalPages ?? Math.max(Math.ceil(total / (resolvedSize || 20)), 1),
  }
}

export async function fetchAllSmsRecipientCandidates(input: {
  programId?: number
  keyword?: string
  participantType?: string
  memberType?: string
}): Promise<SmsSendRecipient[]> {
  const collected: SmsSendRecipient[] = []
  let page = 0
  let totalPages = 1
  while (page < totalPages && collected.length < NOTIFICATION_SEND_BATCH_RECIPIENT_LIMIT) {
    const result = await getSmsRecipientCandidates({ ...input, page, size: 20 })
    collected.push(...result.items)
    totalPages = result.totalPages
    if (result.items.length === 0) break
    page += 1
  }
  return collected.slice(0, NOTIFICATION_SEND_BATCH_RECIPIENT_LIMIT)
}

export async function getSmsTemplateVariables(
  input: NotificationTemplateVariablesQuery = {}
): Promise<NotificationTemplateVariablesCatalogMapped> {
  if (!shouldUseSmsSendRemoteApi()) {
    return { variables: [], systemManualSendQaEnabled: false }
  }
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
  placeholderKeys?: Iterable<string>
  variableCatalog?: AlimtalkVariableCatalogEntry[] | null
}): Promise<void> {
  const {
    templateDisplayName,
    templateBaseline,
    idempotencyKey,
    senderProfileId,
    variables,
    placeholderKeys,
    variableCatalog,
  } = input
  const draft = buildSmsSendPayload(input.draft)
  const validationError = validateSmsSendDraft(draft)
  if (validationError) {
    throw new Error(validationError)
  }
  let sendDraft = draft
  if (placeholderKeys != null) {
    const variableCheck = validateSmsSendVariables({
      programId: draft.programId,
      messageType: draft.messageType,
      subject: draft.subject,
      bodyText: draft.bodyText,
      recipients: draft.recipients,
      placeholderKeys,
      catalog: variableCatalog ?? null,
      catalogState: variableCatalog == null ? 'pending' : 'ready',
    })
    if (!variableCheck.ok) {
      throw new Error(variableCheck.alert)
    }
    sendDraft = { ...draft, recipients: variableCheck.validRecipients }
  }
  assertSmsSendRemoteReady()
  const numericTemplateId =
    draft.templateId && /^\d+$/.test(draft.templateId.trim())
      ? Number(draft.templateId.trim())
      : null
  if (draft.templateId?.trim() && numericTemplateId == null) {
    throw new Error('문자 발송에는 서버에 등록된 템플릿이 필요합니다.')
  }

  let resolvedSenderProfileId = senderProfileId
  if (resolvedSenderProfileId == null && draft.senderPhone.trim()) {
    const profiles = await getSmsSenderProfiles()
    resolvedSenderProfileId = resolveSmsSenderProfileId(profiles, draft.senderPhone)
  }

  const body = buildSmsSendCreateRequest({
    draft: sendDraft,
    templateId: numericTemplateId,
    senderKey: normalizeKoreanPhoneDigits(draft.senderPhone) || draft.senderPhone.trim(),
    senderProfileId: resolvedSenderProfileId,
    placeholderKeys,
    variableCatalog,
  })
  if (templateDisplayName?.trim()) {
    body.batchName = templateDisplayName.trim().slice(0, 200)
  }
  const batchVariables = pickNonEmptySendVariables(variables)
  if (batchVariables) body.variables = batchVariables

  // 템플릿 미선택이면 baseline 없음 → 제목/본문 스냅샷이 항상 실린다.
  applyNotificationSendBodySnapshot(body as CreateRequest, {
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
    body.titleTemplate = draft.subject.trim()
  }

  // templateId 생략·messageType은 BE PR #43 계약. OpenAPI 재생성 전까지 생성 타입과 다르다.
  await createSendBatchRemote(body as CreateRequest, idempotencyKey)
}
