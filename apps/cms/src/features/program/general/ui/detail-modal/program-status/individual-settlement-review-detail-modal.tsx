import { useCallback, useEffect, useMemo, useState } from 'react'
import { Spin } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { ActionResultModal, CmsButton, ContentModal } from '@/shared/ui'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import {
  networkAwareAlertTitle,
  readApiErrorAlertMessage,
} from '@/shared/lib/extract-api-error-message'
import { getSettlementApiErrorMessage } from '@/features/settlement-management/api/get-settlement-api-error'
import {
  individualSettlementReviewDetailQueryOptions,
  isIndividualSettlementReviewRemoteEnabled,
} from '@/features/program/general/api/individual-settlement-review-remote'
import { useIndividualSettlementReviewMutations } from '@/features/program/general/hooks/use-individual-settlement-review-mutations'
import {
  canApproveIndividualSettlement,
  canRejectIndividualSettlement,
  latestIndividualSettlementReviewRevision,
} from '@/features/program/general/lib/individual-settlement-review-status'
import {
  INDIVIDUAL_SETTLEMENT_REVIEW_NESTED_MODAL_Z_INDEX,
  INDIVIDUAL_SETTLEMENT_REVIEW_STATEMENT_MODAL_Z_INDEX,
} from '@/features/program/general/lib/general-program-modal-z-index'
import { mapIndividualSettlementReviewToCalculationStatement } from '@/features/program/general/lib/map-individual-settlement-review-to-calculation-statement'
import { individualSettlementReviewApplicationTypeLabel } from '@/features/program/general/api/individual-settlement-review-types'
import { PaymentOrderCalculationStatementProcessingStatusView } from '@/features/settlement/ui/payment-record/payment-order-calculation-statement-processing-status-view'
import type {
  PaymentOrderCalculationStatementProgramBasicInfo,
  PaymentOrderProgramCalculationStatement,
} from '@/features/settlement-management/model/payment-order-admin-list'
import { PaymentOrderPaymentConfirmationModal } from '@/features/settlement/ui/payment-record/payment-order-payment-confirmation-modal'
import {
  PaymentOrderPaymentRejectionModal,
  type PaymentOrderRejectSubmitPayload,
} from '@/features/settlement/ui/payment-record/payment-order-payment-rejection-modal'
import { PaymentOrderCalculationBreakdownTable } from '@/features/settlement/ui/payment-record/payment-order-calculation-breakdown-table'
import { isPaymentOrderLineEligibleForPaymentStatementIssue } from '@/features/settlement/lib/payment-order-calculation-statement-issuance-view'
import {
  PaymentOrderCalculationBasisDetailModal,
  usePaymentOrderCalculationBasisDetailModal,
} from '@/features/settlement/ui/payment-record/payment-order-calculation-basis-detail-modal'
import '@/features/settlement/ui/payment-record/payment-order-program-calculation-statement-modal.css'
import '@/features/program/shared/ui/program-detail/applicant-list/applicant-instructor-basic-info.css'
import './individual-settlement-review-detail-modal.css'

function IndividualSettlementReviewBasicInfo({
  basic,
  applicationTypeLabel,
}: {
  basic: PaymentOrderCalculationStatementProgramBasicInfo
  /** 구분 — 참여자 / 봉사자 */
  applicationTypeLabel: string
}) {
  return (
    <div className="applicant-instructor-basic-info">
      <DetailInfoForm title="기본 정보" mode="view">
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field label="구분" fullRow view={applicationTypeLabel} readOnlyDisplay />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field label="프로그램명" fullRow view={basic.programName} readOnlyDisplay />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="프로그램 진행 회차"
            view={basic.programSessionProgressDisplay}
            readOnlyDisplay
          />
          <DetailInfoForm.Field
            label="사업 운영 기간"
            view={basic.businessPeriodDisplay}
            readOnlyDisplay
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
      <DetailInfoForm title="기본 정보" hideHeader mode="view">
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="지급조서 처리 현황"
            fullRow
            view={<PaymentOrderCalculationStatementProcessingStatusView basic={basic} />}
            readOnlyDisplay
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </div>
  )
}

export type IndividualSettlementReviewDetailModalProps = {
  open: boolean
  programId: string
  participantId: string
  settlementApplicationId: number | null
  programSessionProgressDisplay?: string | null
  businessPeriodDisplay?: string | null
  /** 기관형 프로그램만 true — 산출 내역 표에 '참여 기관명' 열을 보인다(개인형은 숨김) */
  showInstitutionColumn?: boolean
  onClose: () => void
  onReviewed?: () => Promise<void> | void
}

export function IndividualSettlementReviewDetailModal({
  open,
  programId,
  participantId,
  settlementApplicationId,
  programSessionProgressDisplay,
  businessPeriodDisplay,
  showInstitutionColumn = false,
  onClose,
  onReviewed,
}: IndividualSettlementReviewDetailModalProps) {
  const { showAlert } = useCmsAlert()
  const remoteEnabled = isIndividualSettlementReviewRemoteEnabled()
  const queryEnabled = Boolean(open && remoteEnabled && settlementApplicationId != null)

  const detailQuery = useQuery({
    ...individualSettlementReviewDetailQueryOptions(settlementApplicationId ?? 0),
    enabled: queryEnabled,
    retry: false,
  })

  const { approveMutation, rejectMutation } = useIndividualSettlementReviewMutations({
    programId,
    participantId,
    settlementApplicationId,
    onReviewed,
  })

  const [approveOpen, setApproveOpen] = useState(false)
  const [approveDoneOpen, setApproveDoneOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)

  const {
    basisDetailOpen,
    selectedBasisDetail,
    handleBasisDetailClick,
    closeBasisDetailModal,
  } = usePaymentOrderCalculationBasisDetailModal(open, { remoteData: true })

  /* eslint-disable react-hooks/set-state-in-effect -- 모달 닫힘과 동기화 */
  useEffect(() => {
    if (!open) {
      setApproveOpen(false)
      setApproveDoneOpen(false)
      setRejectOpen(false)
    }
  }, [open])
  /* eslint-enable react-hooks/set-state-in-effect */

  const detail = detailQuery.data
  const latest = latestIndividualSettlementReviewRevision(detail)
  const expectedRevisionNo = latest?.revisionNo ?? detail?.latestRevisionNo ?? null
  const canApprove = canApproveIndividualSettlement(detail)
  const canReject = canRejectIndividualSettlement(detail)
  const statementView = useMemo(
    () =>
      detail
        ? mapIndividualSettlementReviewToCalculationStatement(detail, {
            programSessionProgressDisplay,
            businessPeriodDisplay,
            includeInstitution: showInstitutionColumn,
          })
        : null,
    [businessPeriodDisplay, detail, programSessionProgressDisplay, showInstitutionColumn]
  )

  const rejectStatement = useMemo((): PaymentOrderProgramCalculationStatement | null => {
    if (statementView == null) return null
    const blocks =
      statementView.blocks.length > 0
        ? statementView.blocks
        : [
            {
              institutionName: '',
              lectureDateDisplay: '-',
              lectureSessionDisplay: '-',
              lines: [],
            },
          ]
    return {
      context: 'program',
      sourceLineRowId: String(settlementApplicationId ?? ''),
      basic: statementView.basic,
      blocks,
      formulaLabel: statementView.formulaLabel,
      totalAmount: statementView.totalAmount,
    }
  }, [settlementApplicationId, statementView])

  const showMutationError = useCallback(
    (error: unknown) => {
      showAlert({
        title: '안내',
        content: readApiErrorAlertMessage(error, '개인 정산 심사를 처리하지 못했습니다.'),
      })
    },
    [showAlert]
  )

  const handleApprove = useCallback(async (scheduledPaymentDate: string) => {
    if (settlementApplicationId == null || expectedRevisionNo == null) return
    try {
      await approveMutation.mutateAsync({
        settlementApplicationId,
        expectedRevisionNo,
        scheduledPaymentDate,
      })
      setApproveOpen(false)
      setApproveDoneOpen(true)
    } catch (error) {
      // 지급 예정일 400(SCHEDULED_PAYMENT_DATE_*)은 강사 지급조서 확인과 같은 문구로 안내한다
      showAlert({
        title: networkAwareAlertTitle(error, '안내'),
        content: getSettlementApiErrorMessage(error, '개인 정산 심사를 처리하지 못했습니다.'),
      })
    }
  }, [approveMutation, expectedRevisionNo, settlementApplicationId, showAlert])

  const handleReject = useCallback(
    async (payload: PaymentOrderRejectSubmitPayload) => {
      const reason = payload.reason.trim()
      if (!reason) {
        showAlert({ title: '안내', content: '반려 사유를 입력해 주세요.' })
        return
      }
      if (settlementApplicationId == null || expectedRevisionNo == null) return
      try {
        await rejectMutation.mutateAsync({
          settlementApplicationId,
          expectedRevisionNo,
          reason,
          notificationType: payload.notificationType,
          scheduledNotificationAt: payload.scheduledNotificationAt,
        })
        setRejectOpen(false)
      } catch (error) {
        showMutationError(error)
      }
    },
    [expectedRevisionNo, rejectMutation, settlementApplicationId, showAlert, showMutationError]
  )

  const reviewing = approveMutation.isPending || rejectMutation.isPending
  const isStatementActionLocked = !canApprove && !canReject

  return (
    <>
      <ContentModal
        open={open}
        onCancel={onClose}
        title="산출 내역서"
        size="large"
        width={1400}
        zIndex={INDIVIDUAL_SETTLEMENT_REVIEW_STATEMENT_MODAL_Z_INDEX}
        className="payment-order-calc-statement-modal individual-settlement-review-detail-modal"
        footer={
          <CmsButton variant="secondary" size="large" type="button" onClick={onClose}>
            닫기
          </CmsButton>
        }
      >
        {detailQuery.isPending && queryEnabled ? (
          <div className="individual-settlement-review-detail-modal__loading" role="status">
            <Spin size="large" />
          </div>
        ) : detailQuery.isError ? (
          <div className="individual-settlement-review-detail-modal__empty">
            {readApiErrorAlertMessage(detailQuery.error, '개인 정산 상세를 불러오지 못했습니다.')}
          </div>
        ) : !detail || statementView == null ? (
          <div className="individual-settlement-review-detail-modal__empty">
            개인 정산 상세가 없습니다.
          </div>
        ) : (
          <>
            <IndividualSettlementReviewBasicInfo
              basic={statementView.basic}
              applicationTypeLabel={individualSettlementReviewApplicationTypeLabel(
                detail.applicationType
              )}
            />
            <PaymentOrderCalculationBreakdownTable
              blocks={statementView.blocks}
              formulaLabel={statementView.formulaLabel}
              totalAmount={statementView.totalAmount}
              hideInstitutionColumn={!showInstitutionColumn}
              dateColumnTitle="교육 진행 일자"
              lectureSessionSegmentLabel="round"
              tableCellSpec="cms-data-table"
              actionButtonSize="h32"
              // 강사 산출 내역서와 같은 규칙 — 지급조서 확인 완료(승인) 전에는 발급 불가 안내
              paymentStatementIssueDisabled={
                !isPaymentOrderLineEligibleForPaymentStatementIssue(
                  statementView.basic.processingStatusClass
                )
              }
              onBasisDetailClick={handleBasisDetailClick}
              headerActions={
                isStatementActionLocked ? null : (
                  <>
                    {canReject ? (
                      <CmsButton
                        type="button"
                        variant="delete"
                        size="medium"
                        disabled={reviewing}
                        onClick={() => setRejectOpen(true)}
                      >
                        신청 반려
                      </CmsButton>
                    ) : null}
                    {canApprove ? (
                      <CmsButton
                        type="button"
                        variant="primary"
                        size="medium"
                        disabled={reviewing}
                        onClick={() => setApproveOpen(true)}
                      >
                        확인 처리
                      </CmsButton>
                    ) : null}
                  </>
                )
              }
            />
          </>
        )}
      </ContentModal>

      {/* 강사 산출 내역서와 같은 「지급조서 확인 안내」(대상·일정 + 계좌 지급 예정일) */}
      <PaymentOrderPaymentConfirmationModal
        open={approveOpen}
        data={rejectStatement}
        zIndex={INDIVIDUAL_SETTLEMENT_REVIEW_NESTED_MODAL_Z_INDEX}
        applicationKind="receipt"
        onCancel={() => setApproveOpen(false)}
        onConfirm={({ lectureFeePaymentScheduledDateIso }) =>
          void handleApprove(lectureFeePaymentScheduledDateIso)
        }
      />

      <ActionResultModal
        open={approveDoneOpen}
        title="지급조서 확인 완료"
        body="지급조서 확인이 완료되었습니다."
        zIndex={INDIVIDUAL_SETTLEMENT_REVIEW_NESTED_MODAL_Z_INDEX}
        onClose={() => setApproveDoneOpen(false)}
      />

      <PaymentOrderPaymentRejectionModal
        open={rejectOpen}
        onCancel={() => setRejectOpen(false)}
        onReject={payload => void handleReject(payload)}
        data={rejectStatement}
        confirmLoading={rejectMutation.isPending}
        applicationKind="receipt"
      />

      <PaymentOrderCalculationBasisDetailModal
        open={basisDetailOpen}
        onCancel={closeBasisDetailModal}
        detail={selectedBasisDetail}
        zIndex={INDIVIDUAL_SETTLEMENT_REVIEW_NESTED_MODAL_Z_INDEX}
      />
    </>
  )
}
