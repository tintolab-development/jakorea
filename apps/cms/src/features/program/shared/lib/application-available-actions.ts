/** BE `availableActions` — 서류·최종 취소 분기용 */
export const APPLICATION_ACTION_CANCEL_APPROVAL = 'CANCEL_APPROVAL'
export const APPLICATION_ACTION_CANCEL_REJECTION = 'CANCEL_REJECTION'
export const APPLICATION_ACTION_CANCEL_FINAL_PASS = 'CANCEL_FINAL_PASS'
export const APPLICATION_ACTION_CANCEL_FINAL_FAIL = 'CANCEL_FINAL_FAIL'

/**
 * 프로그램 신청 상세/목록 — BE `availableActions` 기반 CTA 게이트.
 * `undefined`는 레거시(목록 투영 누락) 호환으로 허용한다.
 */
export function canPerformApplicationAction(
  availableActions: string[] | undefined,
  action: string
): boolean {
  if (availableActions == null) return true
  return availableActions.includes(action)
}

/** 최종 합격/불합격 취소 — 서버가 명시한 경우만 노출 (`undefined` 레거시 허용 없음) */
export function hasExplicitApplicationAction(
  availableActions: string[] | undefined,
  action: string
): boolean {
  return Array.isArray(availableActions) && availableActions.includes(action)
}

export function isApprovalCancelledApplicationStatus(
  applicationStatus?: string | null
): boolean {
  return applicationStatus?.trim().toUpperCase() === 'APPROVAL_CANCELLED'
}

/**
 * 신청 반려 복원 CTA. REJECTED는 `CANCEL_REJECTION` 레거시 허용(undefined).
 * APPROVAL_CANCELLED는 BE가 명시한 경우에만 노출한다. 동일 복구 API로 가정하지 않는다.
 */
export function canRestoreRejectedApplication(input: {
  availableActions?: string[]
  applicationStatus?: string | null
}): boolean {
  if (isApprovalCancelledApplicationStatus(input.applicationStatus)) {
    return hasExplicitApplicationAction(
      input.availableActions,
      APPLICATION_ACTION_CANCEL_REJECTION
    )
  }
  return canPerformApplicationAction(
    input.availableActions,
    APPLICATION_ACTION_CANCEL_REJECTION
  )
}

/** @deprecated use canRestoreRejectedApplication */
export function canCancelParticipantApplicationRejection(
  availableActions?: string[]
): boolean {
  return canRestoreRejectedApplication({ availableActions })
}
