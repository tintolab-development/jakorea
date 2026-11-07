/**
 * 산출 내역서 모달 — 지급 현황 상세(프로그램/강사) 공통 구현
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { Spin } from 'antd'
import { ContentModal } from '@/shared/ui/content-modal'
import {
  ActionResultModal,
  CmsButton,
  showNotificationResendRequestCompletedAlert,
  useCmsAlert,
} from '@/shared/ui'
import type { PaymentOrderProgramCalculationStatement } from '@/features/settlement-management/model/payment-order-admin-list'
import { getSettlementApiErrorMessage } from '@/features/settlement-management/api/get-settlement-api-error'
import { useConfirmPaymentStatementMutation, useRejectPaymentStatementMutation } from '@/features/settlement-management/hooks/use-confirm-payment-statement-mutation'
import { useResendSettlementNotificationMutation } from '@/features/settlement-management/hooks/use-resend-settlement-notification-mutation'
import { SettlementNotificationResendModal } from '@/features/settlement/ui/payment-record/settlement-notification-resend-modal'
import {
  canResendSettlementCalculationStatementNotification,
  resolveSettlementNotificationResendKind,
} from '@/features/settlement/lib/settlement-notification-resend'
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
import type { RenderFormParagraphBodyOptions } from '@/features/template/ui/paragraph/renderers/render-form-paragraph-body'
import '@/features/program/shared/ui/program-detail/applicant-list/applicant-instructor-basic-info.css'
import '@/features/program/shared/ui/program-detail/project-info/project-info-form-shared.css'
import '@/pages/settlement-management/payment-order-admin-status-tag.css'
import './payment-order-program-calculation-statement-modal.css'
import { PaymentOrderPaymentConfirmationModal } from './payment-order-payment-confirmation-modal'
import { PaymentOrderPaymentRejectionModal } from './payment-order-payment-rejection-modal'
import { PaymentOrderPaymentRejectionResultModal } from './payment-order-payment-rejection-result-modal'
import {
  PAYMENT_ORDER_CALC_STATEMENT_MIN_WIDTH,
  PaymentOrderCalculationBreakdownTable,
} from './payment-order-calculation-breakdown-table'
import {
  PaymentOrderCalculationBasisDetailModal,
  usePaymentOrderCalculationBasisDetailModal,
} from './payment-order-calculation-basis-detail-modal'
import { computePaymentOrderCalculationSubtotalBeforeWithholding } from './payment-order-calculation-basis-detail'
import { PaymentOrderCalculationStatementInstructorBasicSection } from './payment-order-calculation-statement-instructor-basic-section'
import { PaymentOrderCalculationStatementProgramBasicSection } from './payment-order-calculation-statement-program-basic-section'

const CALC_STATEMENT_CONTENT_MIN_WIDTH = PAYMENT_ORDER_CALC_STATEMENT_MIN_WIDTH

export type PaymentOrderCalculationStatementProgramContext = Extract<
  PaymentOrderProgramCalculationStatement,
  { context: 'program' }
>

export type PaymentOrderCalculationStatementInstructorContext = Extract<
  PaymentOrderProgramCalculationStatement,
  { context: 'instructor' }
>

export type PaymentOrderCalculationStatementEntryKind = 'program' | 'instructor'

export interface PaymentOrderCalculationStatementModalImplProps {
  open: boolean
  onCancel: () => void
  data: PaymentOrderProgramCalculationStatement | null
  loading?: boolean
  loadError?: unknown
  paymentOrdersRemote?: boolean
  statementId?: number | null
  settlementId?: number | null
  availableActions?: readonly string[] | null
  detailContextQuery?: PaymentOrdersDetailContextQueryResult
  /**
   * 산출 내역서 UI 유형 — 상세 페이지가 아니라 **테이블 유형**을 따른다.
   * 프로그램 상세의 「신청자별 정산 목록」→ `instructor`
   * 신청자 상세의 「프로그램별 정산 목록」→ `program`
   */
  entryKind: PaymentOrderCalculationStatementEntryKind
  /** 모달 루트에 추가 (진입 경로 구분·스타일 확장용) */
  entryClassName?: string
  /** 확인 처리·신청 반려 확정 시 라인 상태 반영(상위에서 상세 테이블·집계와 동기화) */
  onStatementLineCommitted?: (payload: PaymentOrderCalculationStatementCommitPayload) => void
  /** 반려 결과 모달을 닫은 뒤 산출 내역서까지 닫을 때 */
  onAfterRejectResultClosed?: () => void
  /** 풀페이지 모달 위에서 열 때 (예: 일반 프로그램 상세 1100 위) */
  zIndex?: number
  /**
   * 지급조서(statementId)가 아직 없는 확정 전 정산 신청서 — 확인·반려 API를 상위가 처리.
   * 확인 처리: 같은 「지급조서 확인 안내」(계좌 지급 예정일) 모달을 띄운 뒤 `onConfirm`을 부른다.
   * 신청 반려: `onRejectClick` (상위 사유 모달).
   */
  statementActionOverride?: {
    onConfirm: (lectureFeePaymentScheduledDateIso: string) => Promise<void>
    onRejectClick: () => void
    pending?: boolean
  }
  /** 기관 프로그램이 아니면 산출 내역 「참여 기관명」열 미노출 */
  hideInstitutionColumn?: boolean
  /**
   * 지급조서 보기 본문을 산출 내역서 대신 별도 정본으로 그릴 때 (예: 확정 전 신청서 문서 스냅샷).
   * 지정하지 않으면 기존처럼 산출 내역서에서 만든다.
   */
  issuanceParagraphBodyOptionsOverride?: RenderFormParagraphBodyOptions
}

export function PaymentOrderCalculationStatementModalImpl({
  open,
  onCancel,
  data,
  loading = false,
  loadError,
  paymentOrdersRemote = false,
  statementId,
  settlementId,
  availableActions,
  detailContextQuery,
  entryKind,
  entryClassName,
  onStatementLineCommitted,
  onAfterRejectResultClosed,
  zIndex,
  statementActionOverride,
  hideInstitutionColumn = false,
  issuanceParagraphBodyOptionsOverride,
}: PaymentOrderCalculationStatementModalImplProps) {
  const { showAlert } = useCmsAlert()
  const confirmMutation = useConfirmPaymentStatementMutation()
  const rejectMutation = useRejectPaymentStatementMutation()
  const resendNotificationMutation = useResendSettlementNotificationMutation()
  const resendIdempotencyKeyRef = useRef<string | null>(null)
  const [paymentConfirmOpen, setPaymentConfirmOpen] = useState(false)
  const [paymentConfirmDoneOpen, setPaymentConfirmDoneOpen] = useState(false)
  const [paymentRejectOpen, setPaymentRejectOpen] = useState(false)
  const [paymentRejectDoneOpen, setPaymentRejectDoneOpen] = useState(false)
  const [paymentRejectReason, setPaymentRejectReason] = useState('')
  const [issuanceViewOpen, setIssuanceViewOpen] = useState(false)
  const [notificationResendOpen, setNotificationResendOpen] = useState(false)

  const basisDetailContext = useMemo(() => {
    if (!data || (data.context !== 'program' && data.context !== 'instructor')) {
      return null
    }
    const subtotalBeforeWithholding = computePaymentOrderCalculationSubtotalBeforeWithholding(data.blocks)
    const amountDigits = data.basic.lectureFeeStandardAmount?.replace(/[^\d]/g, '')
    const lectureFeeStandardAmountWon = amountDigits ? Number(amountDigits) : undefined
    return {
      lectureFeeStandardTitle: data.basic.lectureFeeStandardTitle,
      withholdingDailySalaryTotalWon:
        subtotalBeforeWithholding > 0 ? subtotalBeforeWithholding : undefined,
      remoteData: paymentOrdersRemote,
      // 모달 강의 시간 = calculationDetail만. lectureSessionDisplay/sessionOrdinal 합성 금지.
      lectureFeeStandardAmountWon:
        lectureFeeStandardAmountWon != null && Number.isFinite(lectureFeeStandardAmountWon)
          ? lectureFeeStandardAmountWon
          : undefined,
    }
  }, [data, paymentOrdersRemote])

  const {
    basisDetailOpen,
    selectedBasisDetail,
    handleBasisDetailClick,
    closeBasisDetailModal,
  } = usePaymentOrderCalculationBasisDetailModal(open, basisDetailContext)

  /* eslint-disable react-hooks/set-state-in-effect -- 모달 닫힘과 동기화 */
  useEffect(() => {
    if (!open) {
      setPaymentConfirmOpen(false)
      setPaymentConfirmDoneOpen(false)
      setPaymentRejectOpen(false)
      setPaymentRejectDoneOpen(false)
      setPaymentRejectReason('')
      setIssuanceViewOpen(false)
      setNotificationResendOpen(false)
      resendIdempotencyKeyRef.current = null
    }
  }, [open])
  /* eslint-enable react-hooks/set-state-in-effect */

  const issuanceInput = useMemo(() => {
    if (!data) return null
    if (entryKind === 'program') {
      return mapProgramCalculationStatementToIssuanceInput(
        data as PaymentOrderCalculationStatementProgramContext
      )
    }
    return mapInstructorCalculationStatementToIssuanceInput(
      data as PaymentOrderCalculationStatementInstructorContext
    )
  }, [data, entryKind])

  const issuanceParagraphBodyOptions = useMemo(() => {
    if (issuanceParagraphBodyOptionsOverride) return issuanceParagraphBodyOptionsOverride
    if (!issuanceInput) return undefined
    const options = buildPaymentStatementIssuanceViewOptionsFromCalculation(issuanceInput)
    // 개인형 — 지급조서 산출 내역에서도 「참여 기관명」열 미노출
    if (hideInstitutionColumn && options.paymentStatementCalculationLines) {
      return {
        ...options,
        paymentStatementCalculationLines: {
          ...options.paymentStatementCalculationLines,
          hideInstitutionColumn: true,
        },
      }
    }
    return options
  }, [hideInstitutionColumn, issuanceInput, issuanceParagraphBodyOptionsOverride])

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
        zIndex={zIndex}
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
        zIndex={zIndex}
        className={rootClass}
        footer={
          <CmsButton variant="secondary" size="large" onClick={onCancel}>
            닫기
          </CmsButton>
        }
      >
        <div className="account-payments-page__error" role="alert">
          {getSettlementApiErrorMessage(loadError, '산출 내역서를 불러오지 못했습니다.')}
        </div>
      </ContentModal>
    )
  }

  if (!data || (data.context !== 'program' && data.context !== 'instructor')) {
    return null
  }

  const statement = data

  if (import.meta.env.DEV && statement.context !== entryKind) {
    console.warn(
      '[payment-order-calc-statement] data.context와 entryKind 불일치',
      { context: statement.context, entryKind }
    )
  }

  const processingStatusClass = statement.basic.processingStatusClass
  const resendKind = resolveSettlementNotificationResendKind(processingStatusClass)
  const canResendNotification =
    paymentOrdersRemote &&
    settlementId != null &&
    resendKind != null &&
    canResendSettlementCalculationStatementNotification(
      processingStatusClass,
      availableActions
    )
  const hasStoredRejectionReason = Boolean(statement.basic.processingRejectionReason?.trim())
  const canIssuePaymentStatement = isPaymentOrderLineEligibleForPaymentStatementIssue(
    processingStatusClass
  )
  const isStatementActionLocked =
    processingStatusClass === 'confirmed' ||
    processingStatusClass === 'awaiting_payment' ||
    processingStatusClass === 'rejected' ||
    processingStatusClass === 'application_rejected'

  const handleRemoteConfirm = async (lectureFeePaymentScheduledDateIso: string) => {
    if (statementId == null) {
      showAlert({
        title: '안내',
        content: '지급조서 확인 API에 필요한 statementId가 없습니다.',
      })
      return
    }
    try {
      await confirmMutation.mutateAsync({
        statementIds: [statementId],
        lectureFeePaymentScheduledDate: lectureFeePaymentScheduledDateIso,
      })
      await detailContextQuery?.refetch()
      onStatementLineCommitted?.({
        lineId: statement.sourceLineRowId,
        status: 'confirmed',
        lectureFeePaymentScheduledDate: lectureFeePaymentScheduledDateIso,
      })
      setPaymentConfirmOpen(false)
      setPaymentConfirmDoneOpen(true)
    } catch (error) {
      showAlert({
        title: '안내',
        content: getSettlementApiErrorMessage(error, '지급조서 확인 처리에 실패했습니다.'),
      })
    }
  }

  const handleReject = async (payload: {
    reason: string
    notificationType: 'IMMEDIATE' | 'ON_ANNOUNCEMENT' | 'MANUAL'
    scheduledNotificationAt?: string
  }) => {
    if (paymentOrdersRemote) {
      if (statementId == null) {
        showAlert({
          title: '안내',
          content: '신청 반려 API에 필요한 statementId가 없습니다.',
        })
        return
      }
      try {
        await rejectMutation.mutateAsync({
          statementId,
          reason: payload.reason,
          notificationType: payload.notificationType,
          scheduledNotificationAt: payload.scheduledNotificationAt,
        })
        await detailContextQuery?.refetch()
      } catch (error) {
        showAlert({
          title: '안내',
          content: getSettlementApiErrorMessage(error, '신청 반려 처리에 실패했습니다.'),
        })
        return
      }
    }
    onStatementLineCommitted?.({
      lineId: statement.sourceLineRowId,
      status: 'application_rejected',
      rejectionReason: payload.reason,
    })
    setPaymentRejectOpen(false)
    setPaymentRejectReason(payload.reason)
    setPaymentRejectDoneOpen(true)
  }

  const basicSection =
    entryKind === 'program' ? (
      <PaymentOrderCalculationStatementProgramBasicSection
        basic={
          statement.context === 'program'
            ? statement.basic
            : (statement.basic as unknown as PaymentOrderCalculationStatementProgramContext['basic'])
        }
        style={{ minWidth: CALC_STATEMENT_CONTENT_MIN_WIDTH }}
        onResendNotificationClick={
          canResendNotification ? () => setNotificationResendOpen(true) : undefined
        }
      />
    ) : (
      <PaymentOrderCalculationStatementInstructorBasicSection
        basic={
          statement.context === 'instructor'
            ? statement.basic
            : (statement.basic as unknown as PaymentOrderCalculationStatementInstructorContext['basic'])
        }
        style={{ minWidth: CALC_STATEMENT_CONTENT_MIN_WIDTH }}
        onResendNotificationClick={
          canResendNotification ? () => setNotificationResendOpen(true) : undefined
        }
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
        zIndex={zIndex}
        className={rootClass}
        footer={
          <CmsButton variant="secondary" size="large" onClick={onCancel}>
            닫기
          </CmsButton>
        }
      >
        {basicSection}
        <PaymentOrderCalculationBreakdownTable
          layout="payment-statement"
          hideInstitutionColumn={hideInstitutionColumn}
          blocks={statement.blocks}
          formulaLabel={statement.formulaLabel}
          totalAmount={statement.totalAmount}
          detailDescription={
            entryKind === 'instructor'
              ? '교통비 및 숙소비는 강사가 지급 신청한 경우에만 항목 노출됩니다.'
              : undefined
          }
          paymentStatementIssueDisabled={!canIssuePaymentStatement}
          lectureSessionSegmentLabel={entryKind === 'instructor' ? 'round' : 'session'}
          onBasisDetailClick={handleBasisDetailClick}
          onDownloadPaymentStatement={() => setIssuanceViewOpen(true)}
          headerActions={
            statementActionOverride ? (
              <>
                <CmsButton
                  variant="delete"
                  size="medium"
                  disabled={statementActionOverride.pending}
                  onClick={statementActionOverride.onRejectClick}
                >
                  신청 반려
                </CmsButton>
                <CmsButton
                  variant="primary"
                  size="medium"
                  disabled={statementActionOverride.pending}
                  onClick={() => setPaymentConfirmOpen(true)}
                >
                  확인 처리
                </CmsButton>
              </>
            ) : isStatementActionLocked ? null : (
              <>
                <CmsButton
                  variant="delete"
                  size="medium"
                  disabled
                  onClick={() =>
                    showAlert({
                      title: '안내',
                      content:
                        '산출 내역서에서는 신청 반려를 처리할 수 없습니다. 개인 일정별 정산 신청 상세에서만 반려할 수 있습니다.',
                    })
                  }
                >
                  신청 반려
                </CmsButton>
                <CmsButton
                  variant="primary"
                  size="medium"
                  disabled={confirmMutation.isPending}
                  onClick={() => setPaymentConfirmOpen(true)} >
                  확인 처리
                </CmsButton>
              </>
            )
          }
        />
      </ContentModal>
      <PaymentOrderPaymentConfirmationModal
        open={paymentConfirmOpen}
        onCancel={() => setPaymentConfirmOpen(false)}
        onConfirm={({ lectureFeePaymentScheduledDateIso }) => {
          if (statementActionOverride) {
            void statementActionOverride
              .onConfirm(lectureFeePaymentScheduledDateIso)
              .then(() => {
                setPaymentConfirmOpen(false)
                setPaymentConfirmDoneOpen(true)
              })
              .catch(() => undefined)
            return
          }
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
        zIndex={zIndex != null ? zIndex + 100 : undefined}
      />
      <ActionResultModal
        open={paymentConfirmDoneOpen}
        title="지급조서 확인 완료"
        body="지급조서 확인이 완료되었습니다."
        zIndex={zIndex != null ? zIndex + 100 : undefined}
        onClose={() => setPaymentConfirmDoneOpen(false)}
      />
      <PaymentOrderPaymentRejectionModal
        open={paymentRejectOpen}
        onCancel={() => setPaymentRejectOpen(false)}
        onReject={payload => {
          void handleReject(payload)
        }}
        data={statement}
        confirmLoading={rejectMutation.isPending}
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
        open={issuanceViewOpen && Boolean(issuanceParagraphBodyOptions)}
        onClose={() => setIssuanceViewOpen(false)}
        paragraphBodyOptions={issuanceParagraphBodyOptions}
        fileName={issuanceFileName}
        settlementId={settlementId ?? undefined}
        zIndex={1500}
      />
      <PaymentOrderCalculationBasisDetailModal
        open={basisDetailOpen}
        onCancel={closeBasisDetailModal}
        detail={selectedBasisDetail}
        zIndex={zIndex != null ? zIndex + 100 : 1400}
      />
      {resendKind != null ? (
        <SettlementNotificationResendModal
          open={notificationResendOpen}
          kind={resendKind}
          hasStoredRejectionReason={hasStoredRejectionReason}
          confirmLoading={resendNotificationMutation.isPending}
          zIndex={1500}
          onCancel={() => {
            if (resendNotificationMutation.isPending) return
            resendIdempotencyKeyRef.current = null
            setNotificationResendOpen(false)
          }}
          onConfirm={payload => {
            if (settlementId == null || resendNotificationMutation.isPending) return
            if (
              payload.notifyTiming === 'manual' &&
              (!payload.manualNotifyAt || !payload.manualNotifyAt.isAfter(new Date()))
            ) {
              void showAlert({
                title: '예약 발송 일시 확인',
                content: '예약 발송 일시는 현재 시각보다 이후로 설정해 주세요.',
              })
              return
            }
            const idempotencyKey =
              resendIdempotencyKeyRef.current ??
              `settlement-${settlementId}-${crypto.randomUUID()}`
            resendIdempotencyKeyRef.current = idempotencyKey
            void resendNotificationMutation
              .mutateAsync({
                settlementId,
                idempotencyKey,
                body: {
                  timing: payload.notifyTiming === 'manual' ? 'SCHEDULED' : 'IMMEDIATE',
                  scheduledAt:
                    payload.notifyTiming === 'manual'
                      ? (payload.manualNotifyAt?.toISOString() ?? null)
                      : null,
                  reason:
                    resendKind === 'rejected' ? payload.reason.trim() || null : null,
                },
              })
              .then(() => {
                resendIdempotencyKeyRef.current = null
                setNotificationResendOpen(false)
                showNotificationResendRequestCompletedAlert()
              })
              .catch(error => {
                showAlert({
                  title: '알림 재발송 실패',
                  content: getSettlementApiErrorMessage(
                    error,
                    '알림 재발송에 실패했습니다. 잠시 후 다시 시도해 주세요.'
                  ),
                })
              })
          }}
        />
      ) : null}
    </>
  )
}
