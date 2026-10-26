import type { CreateRequest, RecipientRequest } from '@/shared/api/generated/notifications/schemas'
import {
  pickAlimtalkRecipientSendVariables,
  type AlimtalkVariableCatalogEntry,
} from '@/features/notifications/model/alimtalk-send/recipient-variables'
import {
  isValidKoreanPhoneNumber,
  normalizeKoreanPhoneDigits,
} from '@/shared/utils/phone-validation'
import { dedupeSmsSendRecipients } from './recipients'
import type { SmsSendDraft, SmsSendRecipient } from './types'
import {
  isNotificationSendWithoutProgram,
  parseNotificationSendProgramId,
} from '@/features/notifications/model/send-program-id'
import {
  resolveScheduledAtForCreateRequest,
  validateNotificationScheduledAt,
} from '@/features/notifications/model/send-scheduled-at'
import { normalizeNotificationPlaceholderMarkup } from '@/features/notifications/model/shared/notification-placeholder-markup'
import { collectSmsComposeFieldIssues, firstSmsComposeIssueMessage } from './text-bytes'

export {
  SMS_SEND_BODY_BYTE_LIMIT,
  SMS_SEND_LMS_MMS_BODY_BYTE_LIMIT,
  estimateSmsSendBodyBytes,
} from './text-bytes'

/**
 * @deprecated 서버 enrich 예약 키는 Create body에 넣지 않는다.
 * MEMBER는 actorId만, DIRECT는 recipientContact만 사용.
 */
export function buildSmsRecipientVariables(
  _recipient: SmsSendRecipient
): Record<string, string> | undefined {
  return undefined
}

function resolveSmsSendActorId(recipient: SmsSendRecipient): number | undefined {
  if (recipient.actorId != null && Number.isFinite(recipient.actorId)) {
    return recipient.actorId
  }
  const actorIdMatch = /^actor-[^-]+-(\d+)$/.exec(recipient.id)
  const parsedActorId = actorIdMatch ? Number(actorIdMatch[1]) : undefined
  return Number.isFinite(parsedActorId) ? parsedActorId : undefined
}

function buildSmsSendRecipients(
  recipients: SmsSendRecipient[],
  variableContext?: {
    keys: Iterable<string>
    catalog: AlimtalkVariableCatalogEntry[] | null | undefined
    programSelected: boolean
  }
): RecipientRequest[] {
  return dedupeSmsSendRecipients(recipients).map(recipient => {
    const variables = variableContext
      ? pickAlimtalkRecipientSendVariables({
          recipient,
          keys: variableContext.keys,
          catalog: variableContext.catalog,
          programSelected: variableContext.programSelected,
        })
      : undefined
    if (recipient.source === 'manual' || recipient.actorType === 'DIRECT') {
      const contact = normalizeKoreanPhoneDigits(recipient.phone) || recipient.phone.trim()
      return {
        actorType: 'DIRECT',
        recipientContact: contact,
        recipientName: recipient.name.trim() || undefined,
        ...(variables ? { variables } : {}),
      }
    }

    return {
      actorType: recipient.actorType || 'MEMBER',
      actorId: resolveSmsSendActorId(recipient),
      ...(variables ? { variables } : {}),
    }
  })
}

export function resolveSmsSendProgramId(programId: string | undefined): number | null {
  return parseNotificationSendProgramId(programId) ?? null
}

/**
 * 문자 발송 Create body (BE JABACK PR #43 + MMS 첨부).
 * - templateId 있음: 기존 계약 그대로(messageType은 보내지 않고 템플릿 유형 사용)
 * - templateId 없음(템플릿 미선택 = 템플릿 사용 안 함): templateId 생략(null/0/'' 금지) + messageType 필수.
 *   발신번호는 senderProfileId 우선, 없을 때만 senderKey. 발송 목적·senderProfileType·
 *   senderProfileDisplayName은 보내지 않는다(BE가 NORMAL 저장).
 * - attachmentFileIds: MMS에서 요청 첨부가 있을 때만(중복 제거, 선택 순서 유지). 그 외 생략.
 */
export type SmsSendCreateRequest = CreateRequest

export const SMS_SEND_ATTACHMENT_PENDING_MESSAGE =
  '첨부파일 업로드·보안 검사가 끝난 뒤 발송할 수 있습니다. 잠시 후 다시 시도해 주세요.'

/**
 * 발송 요청에 실을 MMS 첨부 fileObjectId.
 * draft.messageType은 템플릿 선택 시 템플릿의 문자 유형이다(발송 유형 라디오 잠금).
 * MMS가 아니거나 요청 첨부가 없으면 undefined(필드 생략) → 템플릿 MMS는 템플릿 첨부 사용.
 */
export function resolveSmsSendAttachmentFileIds(
  draft: Pick<SmsSendDraft, 'messageType' | 'attachmentFileIds'>
): number[] | undefined {
  if (draft.messageType !== 'MMS') return undefined
  const ids: number[] = []
  for (const id of draft.attachmentFileIds ?? []) {
    if (!Number.isInteger(id) || id < 1 || ids.includes(id)) continue
    ids.push(id)
  }
  return ids.length > 0 ? ids : undefined
}

export function buildSmsSendCreateRequest(input: {
  draft: SmsSendDraft
  templateId: number | null
  senderKey?: string
  senderProfileId?: number
  placeholderKeys?: Iterable<string>
  variableCatalog?: AlimtalkVariableCatalogEntry[] | null
}): SmsSendCreateRequest {
  const { draft, templateId, senderKey, senderProfileId } = input
  const programId = resolveSmsSendProgramId(draft.programId)
  if (!isNotificationSendWithoutProgram(draft.programId) && programId == null) {
    throw new Error('대상 프로그램을 선택하세요.')
  }

  const body: SmsSendCreateRequest = {
    batchName: (draft.subject || draft.bodyText).trim().slice(0, 200) || '문자 발송',
    ...(templateId != null ? { templateId } : { messageType: draft.messageType }),
    scheduledAt: resolveScheduledAtForCreateRequest({
      sendTiming: draft.sendTiming,
      scheduledAt: draft.scheduledAt,
    }),
    // 템플릿 미선택: senderProfileId가 있으면 senderKey 생략(둘 다 보내면 BE가 일치 검증)
    senderKey:
      templateId == null && senderProfileId != null ? undefined : senderKey?.trim() || undefined,
    senderProfileId,
    recipients: buildSmsSendRecipients(
      draft.recipients,
      input.placeholderKeys
        ? {
            keys: input.placeholderKeys,
            catalog: input.variableCatalog ?? null,
            programSelected: programId != null,
          }
        : undefined
    ),
  }
  if (programId != null) body.programId = programId
  const attachmentFileIds = resolveSmsSendAttachmentFileIds(draft)
  if (attachmentFileIds) body.attachmentFileIds = attachmentFileIds
  return body
}

export function buildSmsSendPayload(draft: SmsSendDraft): SmsSendDraft {
  return {
    ...draft,
    senderPhone: draft.senderPhone.trim(),
    subject: normalizeNotificationPlaceholderMarkup(draft.subject),
    bodyText: normalizeNotificationPlaceholderMarkup(draft.bodyText),
  }
}

/** BE contentTemplate 한도: UTF-8 2,000byte (화면 카운터의 NHN 바이트와 별개) */
export const SMS_SEND_CONTENT_UTF8_BYTE_LIMIT = 2000
export const SMS_SEND_CONTENT_UTF8_OVER_MESSAGE =
  '본문은 UTF-8 기준 최대 2,000byte까지 발송할 수 있습니다. 내용을 줄여 주세요.'

export function estimateUtf8Bytes(text: string): number {
  return new TextEncoder().encode(text).length
}

export function validateSmsSendDraft(draft: SmsSendDraft): string | null {
  if (!draft.senderPhone.trim()) return '발신 번호를 입력하세요.'
  if (!isValidKoreanPhoneNumber(draft.senderPhone)) {
    return '발신 번호 형식이 올바르지 않습니다.'
  }
  const scheduleError = validateNotificationScheduledAt({
    sendTiming: draft.sendTiming,
    scheduledAt: draft.scheduledAt,
  })
  if (scheduleError) return scheduleError
  if (draft.recipients.length === 0) return '수신자를 설정하세요.'
  if (draft.attachmentUploadPending) return SMS_SEND_ATTACHMENT_PENDING_MESSAGE
  if (
    !isNotificationSendWithoutProgram(draft.programId) &&
    parseNotificationSendProgramId(draft.programId) == null
  ) {
    return '대상 프로그램을 선택하세요.'
  }
  const missingDirectContact = draft.recipients.some(
    recipient =>
      (recipient.source === 'manual' || recipient.actorType === 'DIRECT') &&
      !(normalizeKoreanPhoneDigits(recipient.phone) || recipient.phone.trim())
  )
  if (missingDirectContact) return '직접 입력 수신자의 연락처를 입력하세요.'

  const composeError = firstSmsComposeIssueMessage(
    collectSmsComposeFieldIssues({
      messageType: draft.messageType,
      subject: draft.subject,
      bodyText: draft.bodyText,
      attachmentCount: draft.attachmentFileNames.length,
    })
  )
  if (composeError) return composeError
  if (estimateUtf8Bytes(draft.bodyText) > SMS_SEND_CONTENT_UTF8_BYTE_LIMIT) {
    return SMS_SEND_CONTENT_UTF8_OVER_MESSAGE
  }

  return null
}
