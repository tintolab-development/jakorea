import type { CreateRequest, RecipientRequest } from '@/shared/api/generated/notifications/schemas'
import {
  isValidKoreanPhoneNumber,
  normalizeKoreanPhoneDigits,
} from '@/shared/utils/phone-validation'
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
import {
  collectSmsComposeFieldIssues,
  firstSmsComposeIssueMessage,
} from './text-bytes'

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

function buildSmsSendRecipients(recipients: SmsSendRecipient[]): RecipientRequest[] {
  return recipients.map(recipient => {
    if (recipient.source === 'manual' || recipient.actorType === 'DIRECT') {
      const contact = normalizeKoreanPhoneDigits(recipient.phone) || recipient.phone.trim()
      return {
        actorType: 'DIRECT',
        recipientContact: contact,
        recipientName: recipient.name.trim() || undefined,
      }
    }

    return {
      actorType: recipient.actorType || 'MEMBER',
      actorId: resolveSmsSendActorId(recipient),
    }
  })
}

export function resolveSmsSendProgramId(programId: string | undefined): number | null {
  return parseNotificationSendProgramId(programId) ?? null
}

export function buildSmsSendCreateRequest(input: {
  draft: SmsSendDraft
  templateId: number
  senderKey?: string
  senderProfileId?: number
}): CreateRequest {
  const { draft, templateId, senderKey, senderProfileId } = input
  const programId = resolveSmsSendProgramId(draft.programId)
  if (!isNotificationSendWithoutProgram(draft.programId) && programId == null) {
    throw new Error('대상 프로그램을 선택하세요.')
  }

  const body: CreateRequest = {
    batchName: (draft.subject || draft.bodyText).trim().slice(0, 200) || '문자 발송',
    templateId,
    scheduledAt: resolveScheduledAtForCreateRequest({
      sendTiming: draft.sendTiming,
      scheduledAt: draft.scheduledAt,
    }),
    senderKey: senderKey?.trim() || undefined,
    senderProfileId,
    recipients: buildSmsSendRecipients(draft.recipients),
  }
  if (programId != null) body.programId = programId
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

export function validateSmsSendDraft(draft: SmsSendDraft): string | null {
  if (!draft.templateId?.trim()) return '템플릿을 선택하세요.'
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

  return null
}
