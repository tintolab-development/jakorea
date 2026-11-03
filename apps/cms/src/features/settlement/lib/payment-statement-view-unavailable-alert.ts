import type { InstructorSettlementUiStatus } from '@/shared/constants/instructor-settlement-status'
import type { CmsAlertModalShowOptions } from '@/shared/ui/cms-alert-modal-api'

/** 지급조서 [보기]/[상세보기] — 미신청·신청 이력 없음 */
export const PAYMENT_STATEMENT_VIEW_UNAVAILABLE_ALERT: CmsAlertModalShowOptions = {
  title: '지급조서 조회 불가',
  content:
    '아직 제출된 지급조서가 없어 상세 내역을 확인할 수 없습니다.\n\n지급조서 신청 이후 확인해 주세요.',
  confirmLabel: '확인',
}

/** 신청 반려·확인 완료 등은 이력이 있으므로 조회 가능. `none`(미신청/해당 없음)만 불가. */
export function isInstructorPaymentStatementViewUnavailable(
  status: InstructorSettlementUiStatus
): boolean {
  return status === 'none'
}

export function isPaymentStatementApplicationMissing(
  hasPaymentStatementApplication: boolean
): boolean {
  return !hasPaymentStatementApplication
}
