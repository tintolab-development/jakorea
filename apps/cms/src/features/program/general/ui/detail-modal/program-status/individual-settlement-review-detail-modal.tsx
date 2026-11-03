import { useCallback, useEffect, useMemo, useState } from 'react'
import { Spin } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsButton, CmsTextArea, ContentModal, ConfirmModal } from '@/shared/ui'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import { downloadAdminFile } from '@/shared/lib/admin-file-upload'
import { handleError } from '@/shared/utils/error-handler'
import { readApiErrorAlertMessage } from '@/shared/lib/extract-api-error-message'
import {
  individualSettlementReviewDetailQueryOptions,
  isIndividualSettlementReviewRemoteEnabled,
} from '@/features/program/general/api/individual-settlement-review-remote'
import { useIndividualSettlementReviewMutations } from '@/features/program/general/hooks/use-individual-settlement-review-mutations'
import {
  canApproveIndividualSettlement,
  canRejectIndividualSettlement,
  formatIndividualSettlementDate,
  formatIndividualSettlementWon,
  latestIndividualSettlementReviewRevision,
} from '@/features/program/general/lib/individual-settlement-review-status'
import { mapIndividualSettlementReviewToCalculationStatement } from '@/features/program/general/lib/map-individual-settlement-review-to-calculation-statement'
import { PaymentOrderCalculationStatementProcessingStatusView } from '@/features/settlement/ui/payment-record/payment-order-calculation-statement-processing-status-view'
import type { PaymentOrderCalculationStatementProgramBasicInfo } from '@/features/settlement-management/model/payment-order-admin-list'
import {
  PaymentOrderCalculationBreakdownTable,
  type PaymentOrderCalculationTableRow,
} from '@/features/settlement/ui/payment-record/payment-order-calculation-breakdown-table'
import type { IndividualSettlementReviewFileRef } from '@/shared/api/generated/dashboard/schemas/individualSettlementReviewFileRef'
import type { IndividualSettlementReviewReceipt } from '@/shared/api/generated/dashboard/schemas/individualSettlementReviewReceipt'
import '@/features/settlement/ui/payment-record/payment-order-program-calculation-statement-modal.css'
import '@/features/program/shared/ui/program-detail/applicant-list/applicant-instructor-basic-info.css'
import './individual-settlement-review-detail-modal.css'

function IndividualSettlementReviewBasicInfo({
  basic,
}: {
  basic: PaymentOrderCalculationStatementProgramBasicInfo
}) {
  return (
    <div className="applicant-instructor-basic-info">
      <DetailInfoForm title="기본 정보" mode="view">
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
            label="지급 조서 처리 현황"
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
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [receiptsOpen, setReceiptsOpen] = useState(false)
  const [selectedReceipts, setSelectedReceipts] = useState<IndividualSettlementReviewReceipt[]>([])
  const [selectedItemLabel, setSelectedItemLabel] = useState('')

  /* eslint-disable react-hooks/set-state-in-effect -- 모달 닫힘과 동기화 */
  useEffect(() => {
    if (!open) {
      setApproveOpen(false)
      setRejectOpen(false)
      setRejectReason('')
      setReceiptsOpen(false)
      setSelectedReceipts([])
      setSelectedItemLabel('')
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
          })
        : null,
    [businessPeriodDisplay, detail, programSessionProgressDisplay]
  )

  const handleDownload = useCallback(
    async (file: IndividualSettlementReviewFileRef) => {
      try {
        await downloadAdminFile({
          fileObjectId: file.fileObjectId,
          fileName: file.fileName,
        })
      } catch (error) {
        handleError(error, { context: 'individualSettlementReviewDetail.downloadFile' })
        showAlert({
          title: '안내',
          content: readApiErrorAlertMessage(error, '첨부파일을 다운로드하지 못했습니다.'),
        })
      }
    },
    [showAlert]
  )

  const showMutationError = useCallback(
    (error: unknown) => {
      showAlert({
        title: '안내',
        content: readApiErrorAlertMessage(error, '개인 정산 심사를 처리하지 못했습니다.'),
      })
    },
    [showAlert]
  )

  const handleApprove = useCallback(async () => {
    if (settlementApplicationId == null || expectedRevisionNo == null) return
    try {
      await approveMutation.mutateAsync({
        settlementApplicationId,
        expectedRevisionNo,
      })
      setApproveOpen(false)
    } catch (error) {
      showMutationError(error)
    }
  }, [approveMutation, expectedRevisionNo, settlementApplicationId, showMutationError])

  const handleReject = useCallback(async () => {
    const reason = rejectReason.trim()
    if (!reason) {
      showAlert({ title: '안내', content: '반려 사유를 입력해 주세요.' })
      return
    }
    if (reason.length > 1000) {
      showAlert({ title: '안내', content: '반려 사유는 1000자 이하로 입력해 주세요.' })
      return
    }
    if (settlementApplicationId == null || expectedRevisionNo == null) return
    try {
      await rejectMutation.mutateAsync({
        settlementApplicationId,
        expectedRevisionNo,
        reason,
      })
      setRejectOpen(false)
      setRejectReason('')
    } catch (error) {
      showMutationError(error)
    }
  }, [
    expectedRevisionNo,
    rejectMutation,
    rejectReason,
    settlementApplicationId,
    showAlert,
    showMutationError,
  ])

  const handleBasisDetailClick = useCallback(
    (row: PaymentOrderCalculationTableRow) => {
      const receipts = statementView?.receiptsByItemId[row.lineId] ?? []
      setSelectedItemLabel(row.itemLabel)
      setSelectedReceipts(receipts)
      setReceiptsOpen(true)
    },
    [statementView]
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
            <IndividualSettlementReviewBasicInfo basic={statementView.basic} />
            <PaymentOrderCalculationBreakdownTable
              blocks={statementView.blocks}
              formulaLabel={statementView.formulaLabel}
              totalAmount={statementView.totalAmount}
              institutionColumnTitle="프로그램명"
              dateColumnTitle="교육 진행 일자"
              lectureSessionSegmentLabel="round"
              tableCellSpec="cms-data-table"
              actionButtonSize="h32"
              detailDescription="교통비 및 숙박비는 강사가 지급 신청한 경우에만 항목이 노출됩니다."
              paymentStatementIssueDisabled
              onBasisDetailClick={handleBasisDetailClick}
              headerActions={
                isStatementActionLocked ? null : (
                  <>
                    {canReject ? (
                      <CmsButton
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

      <ConfirmModal
        open={approveOpen}
        title="개인 정산 승인"
        content="이 개인 정산 신청을 승인하시겠습니까?"
        confirmText="승인"
        onCancel={() => setApproveOpen(false)}
        onConfirm={() => void handleApprove()}
        confirmLoading={approveMutation.isPending}
      />

      <ContentModal
        open={rejectOpen}
        onCancel={() => setRejectOpen(false)}
        title="개인 정산 반려"
        className="individual-settlement-review-reject-modal"
        footer={
          <div className="individual-settlement-review-detail-modal__footer">
            <CmsButton
              variant="secondary"
              size="large"
              type="button"
              onClick={() => setRejectOpen(false)}
              disabled={rejectMutation.isPending}
            >
              취소
            </CmsButton>
            <CmsButton
              variant="delete"
              size="large"
              type="button"
              onClick={() => void handleReject()}
              loading={rejectMutation.isPending}
              disabled={rejectMutation.isPending || !rejectReason.trim()}
            >
              반려
            </CmsButton>
          </div>
        }
      >
        <DetailInfoForm
          title=""
          hideHeader
          mode="edit"
          className="individual-settlement-review-reject-modal__form"
        >
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="반려 사유"
              fullRow
              edit={
                <CmsTextArea
                  inputSize="small"
                  width="100%"
                  rows={4}
                  value={rejectReason}
                  maxLength={1000}
                  onChange={event => setRejectReason(event.target.value)}
                  placeholder="반려 사유를 입력해 주세요"
                  aria-label="반려 사유"
                  className="individual-settlement-review-reject-modal__textarea"
                />
              }
              view={rejectReason}
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      </ContentModal>

      <ContentModal
        open={receiptsOpen}
        onCancel={() => setReceiptsOpen(false)}
        title={selectedItemLabel ? `${selectedItemLabel} 산정 기준 상세` : '산정 기준 상세'}
        size="medium"
        footer={
          <CmsButton variant="secondary" size="large" type="button" onClick={() => setReceiptsOpen(false)}>
            닫기
          </CmsButton>
        }
      >
        {selectedReceipts.length === 0 ? (
          <div className="individual-settlement-review-detail-modal__empty">첨부 없음</div>
        ) : (
          <ul className="individual-settlement-review-detail-modal__receipt-list">
            {selectedReceipts.map(receipt => (
              <li key={receipt.receiptId} className="individual-settlement-review-detail-modal__receipt-item">
                <span>
                  {receipt.expenseType} · {formatIndividualSettlementDate(receipt.expenseDate)} ·{' '}
                  {formatIndividualSettlementWon(receipt.amount)}
                </span>
                <div className="individual-settlement-review-detail-modal__file-list">
                  {(receipt.files ?? []).length === 0
                    ? '-'
                    : (receipt.files ?? []).map(file => (
                        <CmsButton
                          key={file.fileObjectId}
                          variant="default"
                          size="small"
                          className="individual-settlement-review-detail-modal__file-button"
                          onClick={() => void handleDownload(file)}
                        >
                          {file.fileName}
                        </CmsButton>
                      ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </ContentModal>
    </>
  )
}
