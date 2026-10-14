/** BE BAD_REQUEST — 학생·참여자 프로그램 숙박비 금지 */
export const PROGRAM_LODGING_PAYMENT_ITEMS_MESSAGE_SNIPPET = '숙박비 지급 항목'

export function isProgramLodgingPaymentItemsBadRequestMessage(message: string): boolean {
  return message.includes(PROGRAM_LODGING_PAYMENT_ITEMS_MESSAGE_SNIPPET)
}

/**
 * 프로그램 상세 저장 API 오류 → RHF 필드.
 * 숙박비 검증은 학생 명단 필드가 아니라 지급 항목으로 매핑한다.
 */
export function resolveProgramDetailSaveApiFormField(options: {
  apiField?: string
  message: string
  errorCode?: string
}): string | undefined {
  const { apiField, message, errorCode } = options
  if (errorCode === 'PROGRAM_STUDENT_DOCUMENTS_NOT_SUPPORTED') {
    return undefined
  }
  if (isProgramLodgingPaymentItemsBadRequestMessage(message)) {
    return 'wagePaymentItemIds'
  }
  return apiField
}
