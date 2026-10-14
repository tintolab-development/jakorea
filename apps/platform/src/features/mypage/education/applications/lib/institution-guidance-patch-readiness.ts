/** PATCH …/application-answers 호출 전 Portal 신청 상세 기준 사전 검사 */

const GUIDANCE_PATCH_READY_FORM_RESPONSE_STATUSES = new Set([
  'SUBMITTED',
  'APPROVED',
  'COMPLETED',
])

export type OrganizationGuidancePatchPortalContext = {
  formResponseId?: number | null
  formResponseStatus?: string | null
  applicationAnswers?: Record<string, unknown> | null
}

export function resolveOrganizationGuidancePatchBlockedMessage(
  input: OrganizationGuidancePatchPortalContext,
): string | null {
  const formResponseId = input.formResponseId
  if (formResponseId == null || !Number.isFinite(formResponseId) || formResponseId <= 0) {
    return (
      '신청서 제출 정보가 없어 안내사항을 저장할 수 없습니다. ' +
      '포털에서 프로그램 신청을 완료한 건인지 확인한 뒤, 화면을 새로고침해 주세요.'
    )
  }

  const status = input.formResponseStatus?.trim()
  if (
    status &&
    !GUIDANCE_PATCH_READY_FORM_RESPONSE_STATUSES.has(status)
  ) {
    return (
      '신청서가 최종 제출 상태가 아니어서 안내사항을 저장할 수 없습니다. ' +
      '신청을 완료한 뒤 다시 시도해 주세요.'
    )
  }

  const answerKeys = Object.keys(input.applicationAnswers ?? {})
  if (answerKeys.length === 0) {
    return (
      '신청 답변을 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요. ' +
      '계속되면 BE에 문의해 주세요.'
    )
  }

  return null
}
