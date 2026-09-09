import type { CreateRequest, RecipientRequest } from '@/shared/api/generated/notifications/schemas'
import {
  isValidKoreanPhoneNumber,
  normalizeKoreanPhoneDigits,
} from '@/shared/utils/phone-validation'
import type { SmsSendDraft, SmsSendRecipient } from './types'
import {
  isNotificationSendAllProgram,
  isNotificationSendProgramUnset,
  parseNotificationSendProgramId,
} from '@/features/notifications/model/send-program-id'
import {
  resolveScheduledAtForCreateRequest,
  validateNotificationScheduledAt,
} from '@/features/notifications/model/send-scheduled-at'

const SMS_BODY_BYTE_LIMIT = 90
const LMS_MMS_BODY_BYTE_LIMIT = 2000

export function estimateSmsSendBodyBytes(text: string): number {
  let bytes = 0
  for (const ch of text) {
    bytes += ch.charCodeAt(0) <= 0x7f ? 1 : 2
  }
  return bytes
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
      actorId: recipient.actorId,
      recipientName: recipient.name.trim() || undefined,
      recipientContact: recipient.phone.includes('*')
        ? undefined
        : normalizeKoreanPhoneDigits(recipient.phone) || undefined,
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
  const isAllProgram = isNotificationSendAllProgram(draft.programId)
  if (!isAllProgram && programId == null) {
    throw new Error('대상 프로그램을 선택하세요.')
  }

  return {
    batchName: (draft.subject || draft.bodyText).trim().slice(0, 200) || '문자 발송',
    templateId,
    ...(programId != null ? { programId } : {}),
    scheduledAt: resolveScheduledAtForCreateRequest({
      sendTiming: draft.sendTiming,
      scheduledAt: draft.scheduledAt,
    }),
    senderKey: senderKey?.trim() || undefined,
    senderProfileId,
    recipients: buildSmsSendRecipients(draft.recipients),
  } as CreateRequest
}

export function buildSmsSendPayload(draft: SmsSendDraft): SmsSendDraft {
  return {
    ...draft,
    senderPhone: draft.senderPhone.trim(),
    subject: draft.messageType === 'SMS' ? '' : draft.subject.trim(),
  }
}

export function validateSmsSendDraft(draft: SmsSendDraft): string | null {
  if (isNotificationSendProgramUnset(draft.programId)) {
    return '대상 프로그램을 선택하세요.'
  }
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
  if (isNotificationSendAllProgram(draft.programId)) {
    const hasProgramBound = draft.recipients.some(
      recipient => recipient.source !== 'manual' && recipient.actorType !== 'DIRECT'
    )
    if (hasProgramBound) {
      return '대상 프로그램이 미선택일 때는 직접 입력 수신자만 사용할 수 있습니다.'
    }
  } else if (parseNotificationSendProgramId(draft.programId) == null) {
    return '대상 프로그램을 선택하세요.'
  }
  const missingDirectContact = draft.recipients.some(
    recipient =>
      (recipient.source === 'manual' || recipient.actorType === 'DIRECT') &&
      !(normalizeKoreanPhoneDigits(recipient.phone) || recipient.phone.trim())
  )
  if (missingDirectContact) return '직접 입력 수신자의 연락처를 입력하세요.'
  if (!draft.bodyText.trim()) return '내용을 작성하세요.'
  if (draft.messageType !== 'SMS' && !draft.subject.trim()) return '제목을 작성하세요.'

  const bodyByteLimit = draft.messageType === 'SMS' ? SMS_BODY_BYTE_LIMIT : LMS_MMS_BODY_BYTE_LIMIT
  if (estimateSmsSendBodyBytes(draft.bodyText) > bodyByteLimit) {
    return `내용은 ${bodyByteLimit.toLocaleString()}byte 이하로 입력하세요.`
  }

  return null
}
