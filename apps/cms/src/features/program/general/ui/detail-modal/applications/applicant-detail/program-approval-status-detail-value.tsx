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
  onResendNotificationClick?: () => void
  /**
   * 반려 사유 표기. 기본 `parenthesized` → 「사유 : (인원초과)」.
   * `plain`: 일반(기관형) 기관 신청 시안 03(1141:240363) 「사유 : 인원초과」.
   */
  rejectionReasonFormat?: 'parenthesized' | 'plain'
  /**
   * 알림 재발송 버튼과 발송 일시 사이 세로 구분선. 기본 true.
   * false: 일반(기관형) 강사 신청 시안 03·06-1 「[알림 재발송] 2026.01.15 09:15:42」(버튼 뒤 구분선 없음).
   */
  sentAtDivider?: boolean
}

export function ProgramApprovalStatusDetailValue({
  status,
  participationRejectionReason,
  approvalNotificationSentAt,
  onResendNotificationClick,
  rejectionReasonFormat = 'parenthesized',
  sentAtDivider = true,
}: ProgramApprovalStatusDetailValueProps) {
  /** 재발송 버튼이 없으면 상태·사유와 일시를 구분선으로 나눈다 */
  const showSentAtDivider = sentAtDivider || !onResendNotificationClick
  if (status === 'pending') {
    return <ApprovalStatusText status="pending" />
  }

  if (status === 'approved') {
    return (
      <div className="applicant-institution-basic-info__approval-status-row">
        <ApprovalStatusText status="approved" />
        {onResendNotificationClick ? (
          <>
            <span className="applicant-institution-basic-info__approval-status-vbar" aria-hidden />
            <SendNotiButton mode="resend" onClick={onResendNotificationClick} />
          </>
        ) : null}
        {approvalNotificationSentAt ? (
          <>
            {showSentAtDivider ? (
              <span
                className="applicant-institution-basic-info__approval-status-vbar"
                aria-hidden
              />
            ) : null}
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
        <span>
          {rejectionReasonFormat === 'plain' ? `사유 : ${reason}` : `사유 : (${reason})`}
        </span>
        {onResendNotificationClick ? (
          <>
            <span className="applicant-institution-basic-info__approval-status-vbar" aria-hidden />
            <SendNotiButton mode="resend" onClick={onResendNotificationClick} />
          </>
        ) : null}
        {approvalNotificationSentAt ? (
          <>
            {showSentAtDivider ? (
              <span
                className="applicant-institution-basic-info__approval-status-vbar"
                aria-hidden
              />
            ) : null}
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
