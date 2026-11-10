import { mailSendUseTemplate } from './flags'
import { MAIL_SEND_PURPOSE, type MailSendDraft, type MailSendPayload } from './types'
import {
  isNotificationSendWithoutProgram,
  parseNotificationSendProgramId,
} from '@/features/notifications/model/send-program-id'
import { validateMailSenderEmail } from '@/features/notifications/model/mail-template/sender-email'
import { validateNotificationScheduledAt } from '@/features/notifications/model/send-scheduled-at'
import { MAIL_SEND_TIMING_REQUIRED_MESSAGE } from './validate-send'

const MAIL_VARIABLE_TOKEN_RE = /#\{[^{}]+\}/
const MAIL_VARIABLE_ATTR_RE = /data-mail-variable\s*=/

export function containsMailVariableTokens(text: string): boolean {
  return MAIL_VARIABLE_TOKEN_RE.test(text) || MAIL_VARIABLE_ATTR_RE.test(text)
}

/** BE senderProfileDisplayName 최대 길이 */
export const MAIL_SENDER_DISPLAY_NAME_MAX_LENGTH = 255

function isBlockedSenderDisplayNameChar(ch: string): boolean {
  const code = ch.charCodeAt(0)
  return code <= 0x1f || code === 0x7f || ch === '<' || ch === '>'
}

/** 발신자명 입력: 줄바꿈 등 제어문자와 < > 를 막고 255자로 자른다. */
export function sanitizeMailSenderDisplayNameInput(value: string): string {
  return Array.from(value)
    .filter(ch => !isBlockedSenderDisplayNameChar(ch))
    .join('')
    .slice(0, MAIL_SENDER_DISPLAY_NAME_MAX_LENGTH)
}

/** 발송 요청 senderProfileDisplayName. 비면 생략(BE가 NHN 프로필 표시명 사용). */
export function resolveMailSenderDisplayNameForSend(value: string | undefined): string | undefined {
  const name = sanitizeMailSenderDisplayNameInput(value ?? '').trim()
  return name || undefined
}

export function buildMailSendPayload(draft: MailSendDraft): MailSendPayload {
  return {
    ...draft,
    purpose: MAIL_SEND_PURPOSE,
    useTemplate: mailSendUseTemplate(draft.templateId),
    senderName: draft.senderName.trim(),
    senderEmail: draft.senderEmail.trim(),
    subject: draft.subject.trim(),
  }
}

export type ValidateMailSendDraftOptions = {
  /** 시안: 발송 시점 기본 미선택 — false면 발송 차단 */
  sendTimingSelected?: boolean
}

export function validateMailSendDraft(
  draft: MailSendDraft,
  options: ValidateMailSendDraftOptions = {}
): string | null {
  if (!draft.templateId?.trim()) return '템플릿을 선택해 주세요.'
  if (options.sendTimingSelected === false) return MAIL_SEND_TIMING_REQUIRED_MESSAGE
  const senderError = validateMailSenderEmail(draft.senderEmail)
  if (senderError) return senderError
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
    return '대상 프로그램을 선택해 주세요.'
  }
  const missingDirectContact = draft.recipients.some(
    recipient =>
      (recipient.source === 'manual' || recipient.actorType === 'DIRECT') && !recipient.email.trim()
  )
  if (missingDirectContact) return '직접 입력 수신자의 연락처를 입력해 주세요.'
  // 제목/본문은 저장된 템플릿 기준 발송. 화면 미리보기용으로만 유지.
  if (!draft.subject.trim()) return '제목을 작성하세요.'
  if (!draft.bodyHtml.trim()) return '내용을 작성하세요.'
  return null
}
