/**
 * 산출 내역서 모달 — 지급 현황 상세(프로그램/강사) 공통 구현
 */

import { useEffect, useState } from 'react'
import { ContentModal } from '@/shared/ui/content-modal'
import { AppButton } from '@/shared/ui/app-button'
import type { PaymentOrderProgramCalculationStatement } from '@/data/mock/payment-order-admin-list'
import type { PaymentOrderCalculationStatementCommitPayload } from '@/pages/settlement-management/payment-order-detail-fullpage-shared'
import '@/features/program/shared/ui/program-detail/applicant-list/applicant-instructor-basic-info.css'
import '@/features/program/shared/ui/program-detail/project-info/project-info-form-shared.css'
import '@/pages/settlement-management/payment-order-admin-status-tag.css'
import './payment-order-program-calculation-statement-modal.css'
import { PaymentOrderPaymentConfirmationModal } from './payment-order-payment-confirmation-modal'
import { PaymentOrderPaymentRejectionModal } from './payment-order-payment-rejection-modal'
import { PaymentOrderPaymentRejectionResultModal } from './payment-order-payment-rejection-result-modal'
import {
  PAYMENT_ORDER_CALC_BREAKDOWN_MIN_WIDTH,
  PaymentOrderCalculationBreakdownTable,
} from './payment-order-calculation-breakdown-table'
import { PaymentOrderCalculationStatementProgramBasicSection } from './payment-order-calculation-statement-program-basic-section'

const CALC_STATEMENT_CONTENT_MIN_WIDTH = PAYMENT_ORDER_CALC_BREAKDOWN_MIN_WIDTH

export type PaymentOrderCalculationStatementProgramContext = Extract<
  PaymentOrderProgramCalculationStatement,
  { context: 'program' }
>

export interface PaymentOrderCalculationStatementModalImplProps {
  open: boolean
  onCancel: () => void
  data: PaymentOrderProgramCalculationStatement | null
  /** 모달 루트에 추가 (진입 경로 구분·스타일 확장용) */
  entryClassName?: string
  /** 확인 처리·신청 반려 확정 시 라인 상태 반영(상위에서 상세 테이블·집계와 동기화) */
  onStatementLineCommitted?: (payload: PaymentOrderCalculationStatementCommitPayload) => void
  /** 반려 결과 모달을 닫은 뒤 산출 내역서까지 닫을 때 */
  onAfterRejectResultClosed?: () => void
}

export function PaymentOrderCalculationStatementModalImpl({
  open,
  onCancel,
  data,
  entryClassName,
  onStatementLineCommitted,
  onAfterRejectResultClosed,
}: PaymentOrderCalculationStatementModalImplProps) {
  const [paymentConfirmOpen, setPaymentConfirmOpen] = useState(false)
  const [paymentRejectOpen, setPaymentRejectOpen] = useState(false)
  const [paymentRejectDoneOpen, setPaymentRejectDoneOpen] = useState(false)
  const [paymentRejectReason, setPaymentRejectReason] = useState('')

  /* 상위에서 open만 false로 줄 때(마스크 등) 자식 확인·반려 모달 상태를 비움 */
  /* eslint-disable react-hooks/set-state-in-effect -- 모달 닫힘과 동기화 */
  useEffect(() => {
    if (!open) {
      setPaymentConfirmOpen(false)
      setPaymentRejectOpen(false)
      setPaymentRejectDoneOpen(false)
      setPaymentRejectReason('')
    }
  }, [open])
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!data || data.context !== 'program') {
    return null
  }

  const statement: PaymentOrderCalculationStatementProgramContext = data
  const rootClass = ['payment-order-calc-statement-modal', entryClassName].filter(Boolean).join(' ')

  return (
    <>
      <ContentModal
        open={open}
        onCancel={onCancel}
        title="산출 내역서"
        size="large"
        width={1400}
        className={rootClass}
        footer={
          <AppButton variant="cancel" size="large" onClick={onCancel}>
            닫기
          </AppButton>
        }
      >
        <PaymentOrderCalculationStatementProgramBasicSection
          basic={statement.basic}
          style={{ minWidth: CALC_STATEMENT_CONTENT_MIN_WIDTH }}
        />
        <PaymentOrderCalculationBreakdownTable
          blocks={statement.blocks}
          formulaLabel={statement.formulaLabel}
          totalAmount={statement.totalAmount}
          processingStatus={statement.basic.processingStatusClass}
          headerActions={
            <>
              <AppButton variant="danger" size="large" onClick={() => setPaymentRejectOpen(true)}>
                신청 반려
              </AppButton>
              <AppButton variant="primary" size="large" onClick={() => setPaymentConfirmOpen(true)}>
                확인 처리
              </AppButton>
            </>
          }
        />
      </ContentModal>
      <PaymentOrderPaymentConfirmationModal
        open={paymentConfirmOpen}
        onCancel={() => setPaymentConfirmOpen(false)}
        onConfirm={({ lectureFeePaymentScheduledDateIso }) => {
          onStatementLineCommitted?.({
            lineId: statement.sourceLineRowId,
            status: 'confirmed',
            lectureFeePaymentScheduledDate: lectureFeePaymentScheduledDateIso,
          })
          setPaymentConfirmOpen(false)
        }}
        data={statement}
      />
      <PaymentOrderPaymentRejectionModal
        open={paymentRejectOpen}
        onCancel={() => setPaymentRejectOpen(false)}
        onReject={reason => {
          onStatementLineCommitted?.({
            lineId: statement.sourceLineRowId,
            status: 'application_rejected',
            rejectionReason: reason,
          })
          setPaymentRejectOpen(false)
          setPaymentRejectReason(reason)
          setPaymentRejectDoneOpen(true)
        }}
        data={statement}
      />
      <PaymentOrderPaymentRejectionResultModal
        open={paymentRejectDoneOpen}
        onClose={() => {
          setPaymentRejectDoneOpen(false)
          onAfterRejectResultClosed?.()
        }}
        data={statement}
        reason={paymentRejectReason}
      />
    </>
  )
}
