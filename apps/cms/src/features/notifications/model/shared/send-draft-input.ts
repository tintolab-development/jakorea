/**
 * 발송 화면(메일·알림톡) 취소/닫기 — 작성 중인 입력이 있으면 확인창을 띄운다 (QA-0369).
 *
 * 화면이 열릴 때 자동으로 채워지는 값(발신 프로필 기본값, 발신자명·발신 메일 시드,
 * 템플릿 목록 「템플릿 사용」으로 미리 지정된 템플릿)은 사용자 입력으로 보지 않는다.
 */

export const NOTIFICATION_SEND_DISCARD_CONFIRM = {
  title: '발송 취소',
  content: '작성 중인 내용이 사라집니다.\n발송 화면을 닫으시겠습니까?',
  confirmText: '닫기',
  cancelText: '계속 작성',
} as const

export type NotificationSendDraftInputState = {
  programSelected: boolean
  templateSelected: boolean
  sendTimingSelected: boolean
  recipientCount: number
  subject?: string
  bodyHtml?: string
  attachmentCount?: number
  /** 메일 문맥 변수(동의 항목·만료일시 등) 입력값 */
  extraValues?: readonly (string | null | undefined)[]
}

/** 태그를 뺀 글자 또는 이미지가 있으면 본문 입력으로 본다. */
export function hasNotificationSendBodyContent(html: string | null | undefined): boolean {
  const value = html ?? ''
  if (/<img\b/i.test(value)) return true
  return (
    value
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/gi, ' ')
      .trim().length > 0
  )
}

export function hasNotificationSendDraftInput(state: NotificationSendDraftInputState): boolean {
  if (state.programSelected) return true
  if (state.templateSelected) return true
  if (state.sendTimingSelected) return true
  if (state.recipientCount > 0) return true
  if ((state.subject ?? '').trim()) return true
  if (hasNotificationSendBodyContent(state.bodyHtml)) return true
  if ((state.attachmentCount ?? 0) > 0) return true
  return (state.extraValues ?? []).some(value => (value ?? '').trim().length > 0)
}
