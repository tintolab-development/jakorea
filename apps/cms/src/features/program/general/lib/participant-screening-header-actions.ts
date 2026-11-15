import {
  APPLICATION_ACTION_CANCEL_DOCUMENT_APPROVAL,
  APPLICATION_ACTION_GIVE_UP,
  hasExplicitApplicationAction,
} from '@/features/program/shared/lib/application-available-actions'
import type { IndividualApplicantScreeningStage } from '@/features/program/general/lib/individual-application-visibility'
import type { ApplicantHeaderActionItem } from '@/features/program/shared/ui/program-detail/applicant-list/applicants-detail-contents'

/**
 * 일반 개인 참여자 심사 상세 헤더 맨 앞 버튼. 노출은 서버 availableActions만 따른다.
 * - 「승인 취소」: 1차 서류 심사 대상자 상세(doc1)에서만 — 시안 05-3 서류 합격(9781:50709).
 *   `CANCEL_DOCUMENT_APPROVAL` → 개인 서류 합격 취소(`cancel-document-approval`).
 *   `CANCEL_APPROVAL`(최종 승인 취소)로 대신 띄우지 않는다. 1차 서류 합격자 상세(시안 08)에는 없다.
 * - 「활동 포기」: `GIVE_UP` → `individual-applications/{id}/give-up` (핸들러를 준 단계에서만)
 */
export function buildParticipantScreeningLeadingHeaderActions(input: {
  screeningStage: IndividualApplicantScreeningStage
  availableActions: string[] | undefined
  onCancelDocumentApproval?: () => void
  onWithdrawActivity?: () => void
}): ApplicantHeaderActionItem[] | undefined {
  const { screeningStage, availableActions, onCancelDocumentApproval, onWithdrawActivity } = input
  const items: ApplicantHeaderActionItem[] = []
  if (
    screeningStage === 'doc1' &&
    onCancelDocumentApproval &&
    hasExplicitApplicationAction(availableActions, APPLICATION_ACTION_CANCEL_DOCUMENT_APPROVAL)
  ) {
    items.push({
      key: 'cancel-document-approval',
      variant: 'delete',
      label: '승인 취소',
      onClick: onCancelDocumentApproval,
    })
  }
  if (onWithdrawActivity && hasExplicitApplicationAction(availableActions, APPLICATION_ACTION_GIVE_UP)) {
    items.push({
      key: 'give-up',
      variant: 'delete',
      label: '활동 포기',
      onClick: onWithdrawActivity,
    })
  }
  return items.length > 0 ? items : undefined
}
