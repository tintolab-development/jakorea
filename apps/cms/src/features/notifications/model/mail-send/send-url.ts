/**
 * 메일 발송 풀페이지 URL 상태 — `pages/notifications/mail-page.tsx` 의 `?modal=send` 와 동일 키.
 * 템플릿 목록 미리보기 「템플릿 사용」은 `send_tpl` 로 템플릿을 미리 지정한다.
 */
export const MAIL_SEND_URL = {
  modal: 'modal',
  modalValue: 'send',
  templateId: 'send_tpl',
} as const

export function openMailSendWithTemplateSearchParams(
  prev: URLSearchParams,
  templateId: string
): URLSearchParams {
  const next = new URLSearchParams(prev)
  next.set(MAIL_SEND_URL.modal, MAIL_SEND_URL.modalValue)
  next.set(MAIL_SEND_URL.templateId, templateId)
  return next
}

export function readMailSendTemplateIdFromSearchParams(searchParams: URLSearchParams): string | null {
  return searchParams.get(MAIL_SEND_URL.templateId)?.trim() || null
}

export function clearMailSendTemplateIdSearchParams(prev: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(prev)
  next.delete(MAIL_SEND_URL.templateId)
  return next
}
