import { isMailSendVariableLocked, mailSendUseTemplate } from './flags'
import { MAIL_SEND_PURPOSE, type MailSendDraft, type MailSendPayload } from './types'

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
  if (!draft.programId) return '대상 프로그램을 선택하세요.'
  if (!draft.senderEmail.trim()) return '발신 메일을 입력하세요.'
  if (draft.sendTiming === 'scheduled' && !draft.scheduledAt) return '예약 일시를 선택하세요.'
  if (draft.recipients.length === 0) return '수신자를 설정하세요.'
  if (!draft.subject.trim()) return '제목을 작성하세요.'
  if (!draft.bodyHtml.trim()) return '내용을 작성하세요.'
  if (
    isMailSendVariableLocked(draft.programId) &&
    (containsMailVariableTokens(draft.subject) || containsMailVariableTokens(draft.bodyHtml))
  ) {
    return '전체 프로그램 선택 시 변수값을 사용할 수 없습니다.'
  }
  return null
}
