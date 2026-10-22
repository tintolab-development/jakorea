/** BE BAD_REQUEST — 레거시 숙박비 설정 거부 메시지. 설정 단계 제한은 제거됐으나 필드 매핑은 유지한다. */
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
