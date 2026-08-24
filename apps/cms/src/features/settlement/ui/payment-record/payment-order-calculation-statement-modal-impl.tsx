/**
 * 산출 내역서 모달 — 지급 현황 상세(프로그램/강사) 공통 구현
 */

import { useEffect, useMemo, useState } from 'react'
import { Spin } from 'antd'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui'
import type { PaymentOrderProgramCalculationStatement } from '@/data/mock/payment-order-admin-list'
import { getSettlementApiErrorMessage } from '@/features/settlement-management/api/get-settlement-api-error'
import { useConfirmPaymentStatementMutation } from '@/features/settlement-management/hooks/use-confirm-payment-statement-mutation'
import type { PaymentOrdersDetailContextQueryResult } from '@/features/settlement-management/hooks/use-payment-orders-detail-query'
import type { PaymentOrderCalculationStatementCommitPayload } from '@/pages/settlement-management/payment-order-detail-fullpage-shared'
import {
  buildPaymentStatementIssuanceFileNameFromCalculation,
  buildPaymentStatementIssuanceViewOptionsFromCalculation,
  isPaymentOrderLineEligibleForPaymentStatementIssue,
  mapInstructorCalculationStatementToIssuanceInput,
  mapProgramCalculationStatementToIssuanceInput,
} from '@/features/settlement/lib/payment-order-calculation-statement-issuance-view'
import { PaymentStatementIssuanceViewModal } from '@/features/program/shared/ui/payment-statement-issuance-view-modal'
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
import { PaymentOrderCalculationStatementInstructorBasicSection } from './payment-order-calculation-statement-instructor-basic-section'
import { PaymentOrderCalculationStatementProgramBasicSection } from './payment-order-calculation-statement-program-basic-section'

const CALC_STATEMENT_CONTENT_MIN_WIDTH = PAYMENT_ORDER_CALC_BREAKDOWN_MIN_WIDTH

export type PaymentOrderCalculationStatementProgramContext = Extract<
  PaymentOrderProgramCalculationStatement,
  { context: 'program' }
>

export type PaymentOrderCalculationStatementInstructorContext = Extract<
  PaymentOrderProgramCalculationStatement,
  { context: 'instructor' }
>

export interface PaymentOrderCalculationStatementModalImplProps {
  open: boolean
  onCancel: () => void
  data: PaymentOrderProgramCalculationStatement | null
  loading?: boolean
  loadError?: unknown
  paymentOrdersRemote?: boolean
  statementId?: number | null
  detailContextQuery?: PaymentOrdersDetailContextQueryResult
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
  loading = false,
  loadError,
  paymentOrdersRemote = false,
  statementId,
  detailContextQuery,
  entryClassName,
  onStatementLineCommitted,
  onAfterRejectResultClosed,
}: PaymentOrderCalculationStatementModalImplProps) {
  const confirmMutation = useConfirmPaymentStatementMutation()
  const [paymentConfirmOpen, setPaymentConfirmOpen] = useState(false)
  const [paymentRejectOpen, setPaymentRejectOpen] = useState(false)
  const [paymentRejectDoneOpen, setPaymentRejectDoneOpen] = useState(false)
  const [paymentRejectReason, setPaymentRejectReason] = useState('')
  const [issuanceViewOpen, setIssuanceViewOpen] = useState(false)

  /* eslint-disable react-hooks/set-state-in-effect -- 모달 닫힘과 동기화 */
  useEffect(() => {
    if (!open) {
      setPaymentConfirmOpen(false)
      setPaymentRejectOpen(false)
      setPaymentRejectDoneOpen(false)
      setPaymentRejectReason('')
      setIssuanceViewOpen(false)
    }
  }, [open])
  /* eslint-enable react-hooks/set-state-in-effect */

  const issuanceInput = useMemo(() => {
    if (!data) return null
    if (data.context === 'program') {
      return mapProgramCalculationStatementToIssuanceInput(data)
    }
    if (data.context === 'instructor') {
      return mapInstructorCalculationStatementToIssuanceInput(data)
    }
    return null
  }, [data])

  const issuanceParagraphBodyOptions = useMemo(
    () =>
      issuanceInput
        ? buildPaymentStatementIssuanceViewOptionsFromCalculation(issuanceInput)
        : undefined,
    [issuanceInput]
  )

  const issuanceFileName = useMemo(
    () =>
      issuanceInput
        ? buildPaymentStatementIssuanceFileNameFromCalculation(issuanceInput)
        : undefined,
    [issuanceInput]
  )

  const rootClass = ['payment-order-calc-statement-modal', entryClassName].filter(Boolean).join(' ')

  if (!open) {
    return null
  }

  if (loading) {
    return (
      <ContentModal
        open={open}
        onCancel={onCancel}
        title="산출 내역서"
        size="large"
        width={1400}
        className={rootClass}
        footer={
          <CmsButton variant="secondary" size="large" onClick={onCancel}>
            닫기
          </CmsButton>
        }
      >
        <div className="detail-fullpage-modal__loading" role="status">
          <Spin />
        </div>
      </ContentModal>
    )
  }

  if (loadError) {
    return (
      <ContentModal
        open={open}
        onCancel={onCancel}
        title="산출 내역서"
        size="large"
        width={1400}
        className={rootClass}
        footer={
          <CmsButton variant="secondary" size="large" onClick={onCancel}>
            닫기
          </CmsButton>
        }
      >
        <div className="account-payments-page__error" role="alert">
          {loadError instanceof Error ? loadError.message : '산출 내역서를 불러오지 못했습니다.'}
        </div>
      </ContentModal>
    )
  }

  if (!data || (data.context !== 'program' && data.context !== 'instructor')) {
    return null
  }

  const statement = data
  const processingStatusClass = statement.basic.processingStatusClass
  const canIssuePaymentStatement = isPaymentOrderLineEligibleForPaymentStatementIssue(
    processingStatusClass
  )

  const handleRemoteConfirm = async (lectureFeePaymentScheduledDateIso: string) => {
    if (statementId == null) {
      window.alert('지급조서 확인 API에 필요한 statementId가 없습니다.')
      return
    }
    try {
      await confirmMutation.mutateAsync([statementId])
      await detailContextQuery?.refetch()
      onStatementLineCommitted?.({
        lineId: statement.sourceLineRowId,
        status: 'confirmed',
        lectureFeePaymentScheduledDate: lectureFeePaymentScheduledDateIso,
      })
      setPaymentConfirmOpen(false)
    } catch (error) {
      window.alert(getSettlementApiErrorMessage(error, '지급조서 확인 처리에 실패했습니다.'))
    }
  }

  const basicSection =
    statement.context === 'program' ? (
      <PaymentOrderCalculationStatementProgramBasicSection
        basic={statement.basic}
        style={{ minWidth: CALC_STATEMENT_CONTENT_MIN_WIDTH }}
      />
    ) : (
      <PaymentOrderCalculationStatementInstructorBasicSection
        basic={statement.basic}
        style={{ minWidth: CALC_STATEMENT_CONTENT_MIN_WIDTH }}
      />
    )

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
          <CmsButton variant="secondary" size="large" onClick={onCancel}>
            닫기
          </CmsButton>
        }
      >
        {basicSection}
        <PaymentOrderCalculationBreakdownTable
          blocks={statement.blocks}
          formulaLabel={statement.formulaLabel}
          totalAmount={statement.totalAmount}
          processingStatus={processingStatusClass}
          paymentStatementIssueDisabled={!canIssuePaymentStatement}
          onDownloadPaymentStatement={() => setIssuanceViewOpen(true)}
          headerActions={
            <>
              <CmsButton
                variant="delete"
                size="medium"
                disabled={paymentOrdersRemote}
                title={paymentOrdersRemote ? '신청 반려 API 연동 대기 중입니다.' : undefined}
                onClick={() => {
                  if (paymentOrdersRemote) {
                    window.alert('신청 반려 API는 백엔드 연동 대기 중입니다.')
                    return
                  }
                  setPaymentRejectOpen(true)
                }}
              >
                신청 반려
              </CmsButton>
              <CmsButton
                variant="primary"
                size="medium"
                onClick={() => setPaymentConfirmOpen(true)}
              >
                확인 처리
              </CmsButton>
            </>
          }
        />
      </ContentModal>
      <PaymentOrderPaymentConfirmationModal
        open={paymentConfirmOpen}
        onCancel={() => setPaymentConfirmOpen(false)}
        onConfirm={({ lectureFeePaymentScheduledDateIso }) => {
          if (paymentOrdersRemote) {
            void handleRemoteConfirm(lectureFeePaymentScheduledDateIso)
            return
          }
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
      <PaymentStatementIssuanceViewModal
        open={issuanceViewOpen}
        onClose={() => setIssuanceViewOpen(false)}
        paragraphBodyOptions={issuanceParagraphBodyOptions}
        fileName={issuanceFileName}
        zIndex={1500}
      />
    </>
  )
}
