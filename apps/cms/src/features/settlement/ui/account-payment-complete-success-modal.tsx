/**
 * 정산 관리 > 계좌 지급 확인 —「계좌 지급 완료」처리 후 완료 안내 모달
 * - 단건: 확인만
 * - 다건: 닫기
 */

import type { ModalProps } from 'antd'
import type { AccountPaymentRow } from '@/features/settlement-management/model/account-payments-list'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui'
import './account-payment-complete-success-modal.css'

/** 인라인 적용 — teal-header-modal·content-modal 전역 CSS보다 우선 */
const ACCOUNT_PAYMENT_COMPLETE_SUCCESS_MODAL_STYLES: NonNullable<ModalProps['styles']> = {
  content: {
    minHeight: 206,
    padding: '26px 30px 34px',
    borderRadius: 12,
    background: '#fff',
    boxShadow: '0 0 25px 0 rgba(0, 0, 0, 0.35)',
    overflow: 'hidden',
    boxSizing: 'border-box',
  },
  body: {
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
  },
}

export type AccountPaymentCompleteSuccessContext =
  | {
      kind: 'single'
      recipientName: string
    }
  | {
      kind: 'bulk'
      recipientName: string
      otherRecipientCount: number
      completedRows: AccountPaymentRow[]
    }

export function buildAccountPaymentCompleteSuccessContext(
  rows: AccountPaymentRow[]
): AccountPaymentCompleteSuccessContext | null {
  if (rows.length === 0) return null
  const recipientName = rows[0].instructorName?.trim() || '신청자'
  if (rows.length === 1) {
    return { kind: 'single', recipientName }
  }
  return {
    kind: 'bulk',
    recipientName,
    otherRecipientCount: rows.length - 1,
    completedRows: rows,
  }
}

export interface AccountPaymentCompleteSuccessModalProps {
  open: boolean
  context: AccountPaymentCompleteSuccessContext | null
  onCancel: () => void
  onIssueBulkTransfer: () => void
}

export function AccountPaymentCompleteSuccessModal({
  open,
  context,
  onCancel,
  onIssueBulkTransfer,
}: AccountPaymentCompleteSuccessModalProps) {
  const canShow = open && context !== null
  const isBulk = context?.kind === 'bulk'

  const title = isBulk ? '계좌 지급 일괄 확인 완료' : '계좌 지급 확인 완료'

  const modalClassName = [
    'account-payment-complete-success-modal',
    isBulk
      ? 'account-payment-complete-success-modal--bulk'
      : 'account-payment-complete-success-modal--single',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <ContentModal
      open={canShow}
      onCancel={onCancel}
      title={title}
      width={600}
      className={modalClassName}
      modalStyles={ACCOUNT_PAYMENT_COMPLETE_SUCCESS_MODAL_STYLES}
      footer={
        isBulk ? (
          <>
            <CmsButton variant="secondary" size="large" onClick={onCancel}>
              닫기
            </CmsButton>
            <CmsButton variant="primary" size="large" onClick={onIssueBulkTransfer}>
              대량이체 양식 발급
            </CmsButton>
          </>
        ) : (
          <CmsButton variant="secondary" size="large" onClick={onCancel}>
            확인
          </CmsButton>
        )
      }
    >
      {context ? (
        <p className="account-payment-complete-success-modal__message">
          {context.kind === 'bulk' ? (
            <>
              <strong className="account-payment-complete-success-modal__name">
                [{context.recipientName}]
              </strong>
              님 외 {context.otherRecipientCount}명의 강사비 계좌 지급 처리가 완료되었습니다.
            </>
          ) : (
            <>
              <strong className="account-payment-complete-success-modal__name">
                [{context.recipientName}]
              </strong>
              님의 강사비 계좌 지급 처리가 완료되었습니다.
            </>
          )}
        </p>
      ) : null}
    </ContentModal>
  )
}
