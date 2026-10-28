export const ALIMTALK_SEND_EMPTY_SENDER_TITLE = '발신 프로필을 먼저 선택해 주세요'
export const ALIMTALK_SEND_EMPTY_TEMPLATE_TITLE = '템플릿을 먼저 선택해 주세요'

/** 4. 템플릿 내용 빈 상태 제목. 템플릿이 있으면 null. */
export function alimtalkSendTemplateContentEmptyTitle(input: {
  senderSelected: boolean
  templateSelected: boolean
}): string | null {
  if (input.templateSelected) return null
  if (input.senderSelected) return ALIMTALK_SEND_EMPTY_TEMPLATE_TITLE
  return ALIMTALK_SEND_EMPTY_SENDER_TITLE
}
