/**
 * 참여 강사 강사비(`…/participants/{participantId}/instructor-fee-policy`) 저장 안내·오류 문구 (BE 회신 A4)
 *
 * 정산 반영 규칙 — 저장하면 정산이 아직 없는 배정(회차)에 바로 반영된다.
 * 취소된 배정과 이미 정산된 배정은 바뀌지 않는다. 정산이 하나라도 있으면 409로 수정 자체를 막는다.
 */
import {
  getGeneralProgramApiErrorCode,
  getGeneralProgramApiErrorMessage,
} from '@/features/program/general/api/get-general-program-api-error'
import { INSTRUCTOR_FEE_POLICY_INVALID_MESSAGE } from '@/features/program/general/lib/applicant-instructor-lecture-fee-basis'

export const INSTRUCTOR_FEE_POLICY_SETTLEMENT_EXISTS = 'INSTRUCTOR_FEE_POLICY_SETTLEMENT_EXISTS'
export const INSTRUCTOR_FEE_POLICY_INVALID = 'INVALID_FEE_POLICY'

/** 409 — 정산된 배정이 있어 수정 불가 → 「지급 정정」 안내 */
export const INSTRUCTOR_FEE_POLICY_PAYMENT_CORRECTION_GUIDE =
  '이미 정산된 회차는 「지급 정정」으로 처리해 주세요.'

/** 강사비 저장 실패 문구 — error.code 분기, 그 외는 서버 message 그대로 */
export function getInstructorFeePolicySaveErrorMessage(error: unknown, fallback: string): string {
  const code = getGeneralProgramApiErrorCode(error)
  if (code === INSTRUCTOR_FEE_POLICY_SETTLEMENT_EXISTS) {
    const message = getGeneralProgramApiErrorMessage(
      error,
      '이 강사의 배정에 정산이 있어 강사비를 수정할 수 없습니다.'
    )
    return `${message}\n${INSTRUCTOR_FEE_POLICY_PAYMENT_CORRECTION_GUIDE}`
  }
  if (code === INSTRUCTOR_FEE_POLICY_INVALID) {
    return getGeneralProgramApiErrorMessage(error, INSTRUCTOR_FEE_POLICY_INVALID_MESSAGE)
  }
  return getGeneralProgramApiErrorMessage(error, fallback)
}

/**
 * 강사비를 바꿔 저장했을 때 「수정 완료」 알림에 덧붙이는 안내.
 * `updatedAssignmentCount` = 이번 저장으로 다시 반영된 정산 전 배정(회차) 수.
 */
export function buildInstructorFeePolicySavedNotice(
  updatedAssignmentCount: number | null | undefined
): string {
  const count =
    typeof updatedAssignmentCount === 'number' && updatedAssignmentCount > 0
      ? updatedAssignmentCount
      : 0
  const applied =
    count > 0 ? `정산 전 배정 ${count}건에 바로 반영되었습니다.` : '반영할 정산 전 배정이 없습니다.'
  return `${applied} 이미 정산된 회차는 바뀌지 않습니다.`
}
