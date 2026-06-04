/**
 * 일반 프로그램 참여자 신청 상세 — 프로그램 승인 현황 값 셀
 * 텍스트(ApprovalStatusText) + 알림 재발송 + 발송 일시
 */

import { ApprovalStatusText } from '@/shared/components/approval-status-text'
import type { ApprovalStatusKey } from '@/shared/components/approval-status-text'
import { SendNotiButton } from '@/features/program/shared/ui/detail-modal/components/send-noti-button'

export interface ProgramApprovalStatusDetailValueProps {
  status: ApprovalStatusKey
  participationRejectionReason?: string
  approvalNotificationSentAt?: string
}

export function ProgramApprovalStatusDetailValue({
  status,
  participationRejectionReason,
  approvalNotificationSentAt,
}: ProgramApprovalStatusDetailValueProps) {
  if (status === 'pending') {
    return <ApprovalStatusText status="pending" />
  }

  if (status === 'approved') {
    return (
      <div className="applicant-institution-basic-info__approval-status-row">
        <ApprovalStatusText status="approved" />
        <span className="applicant-institution-basic-info__approval-status-vbar" aria-hidden />
        <SendNotiButton mode="resend" />
        {approvalNotificationSentAt ? (
          <>
            <span className="applicant-institution-basic-info__approval-status-vbar" aria-hidden />
            <span className="applicant-institution-basic-info__approval-notification-sent-at">
              {approvalNotificationSentAt}
            </span>
          </>
        ) : null}
      </div>
    )
  }

  if (status === 'rejected') {
    const reason = participationRejectionReason ?? '-'
    return (
      <div className="applicant-institution-basic-info__approval-status-row">
        <ApprovalStatusText status="rejected" />
        <span className="applicant-institution-basic-info__approval-status-vbar" aria-hidden />
        <span>사유 : ({reason})</span>
        <span className="applicant-institution-basic-info__approval-status-vbar" aria-hidden />
        <SendNotiButton mode="resend" />
        {approvalNotificationSentAt ? (
          <>
            <span className="applicant-institution-basic-info__approval-status-vbar" aria-hidden />
            <span className="applicant-institution-basic-info__approval-notification-sent-at">
              {approvalNotificationSentAt}
            </span>
          </>
        ) : null}
      </div>
    )
  }

  if (status === 'cancelled') {
    return <ApprovalStatusText status="cancelled" />
  }

  return <>-</>
}
