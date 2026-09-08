import { mailSendUseTemplate } from './flags'
import { MAIL_SEND_PURPOSE, type MailSendDraft, type MailSendPayload } from './types'
import { parseNotificationSendProgramId } from '@/features/notifications/model/send-program-id'
import { validateMailSenderEmail } from '@/features/notifications/model/mail-template/sender-email'

const MAIL_VARIABLE_TOKEN_RE = /#\{[^{}]+\}/
const MAIL_VARIABLE_ATTR_RE = /data-mail-variable\s*=/

export function containsMailVariableTokens(text: string): boolean {
  return MAIL_VARIABLE_TOKEN_RE.test(text) || MAIL_VARIABLE_ATTR_RE.test(text)
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

export function validateMailSendDraft(draft: MailSendDraft): string | null {
  if (parseNotificationSendProgramId(draft.programId) == null) {
    return '대상 프로그램을 선택하세요.'
  }
  if (!draft.templateId?.trim()) return '템플릿을 선택하세요.'
  const senderError = validateMailSenderEmail(draft.senderEmail)
  if (senderError) return senderError
  if (draft.sendTiming === 'scheduled' && !draft.scheduledAt) return '예약 일시를 선택하세요.'
  if (draft.recipients.length === 0) return '수신자를 설정하세요.'
  const missingDirectContact = draft.recipients.some(
    recipient =>
      (recipient.source === 'manual' || recipient.actorType === 'DIRECT') && !recipient.email.trim()
  )
  if (missingDirectContact) return '직접 입력 수신자의 연락처를 입력하세요.'
  // 제목/본문은 저장된 템플릿 기준 발송. 화면 미리보기용으로만 유지.
  if (!draft.subject.trim()) return '제목을 작성하세요.'
  if (!draft.bodyHtml.trim()) return '내용을 작성하세요.'
  return null
}
