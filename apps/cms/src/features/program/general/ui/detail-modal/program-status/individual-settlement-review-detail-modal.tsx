import { useCallback, useEffect, useMemo, useState } from 'react'
import { Spin } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { StatusBadge } from '@/shared/components'
import { CmsButton, CmsTextArea, ContentModal, ConfirmModal } from '@/shared/ui'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
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
  formatIndividualSettlementDateTime,
  formatIndividualSettlementWon,
  individualSettlementReviewStatusAccent,
  individualSettlementReviewStatusLabel,
  INDIVIDUAL_SETTLEMENT_LODGING_NOT_PAYABLE_LABEL,
  isIndividualSettlementLodgingType,
  latestIndividualSettlementReviewRevision,
} from '@/features/program/general/lib/individual-settlement-review-status'
import { formatCmsScheduleDisplayLabel } from '@/features/program/general/lib/organization-preferred-schedule-label'
import type { IndividualSettlementReviewFileRef } from '@/shared/api/generated/dashboard/schemas/individualSettlementReviewFileRef'
import type { IndividualSettlementReviewItem } from '@/shared/api/generated/dashboard/schemas/individualSettlementReviewItem'
import type { IndividualSettlementReviewReceipt } from '@/shared/api/generated/dashboard/schemas/individualSettlementReviewReceipt'
import './individual-settlement-review-detail-modal.css'

export type IndividualSettlementReviewDetailModalProps = {
  open: boolean
  programId: string
  participantId: string
  settlementApplicationId: number | null
  onClose: () => void
  onReviewed?: () => Promise<void> | void
}

function scheduleLabel(name: string | undefined): string {
  const trimmed = name?.trim()
  if (!trimmed) return '-'
  return formatCmsScheduleDisplayLabel(trimmed) || '-'
}

export function IndividualSettlementReviewDetailModal({
  open,
  programId,
  participantId,
  settlementApplicationId,
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

  useEffect(() => {
    if (!open) {
      setApproveOpen(false)
      setRejectOpen(false)
      setRejectReason('')
    }
  }, [open])

  const detail = detailQuery.data
  const latest = latestIndividualSettlementReviewRevision(detail)
  const expectedRevisionNo = latest?.revisionNo ?? detail?.latestRevisionNo ?? null
  const canApprove = canApproveIndividualSettlement(detail)
  const canReject = canRejectIndividualSettlement(detail)

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

  const itemColumns = useMemo(
    () => [
      {
        title: '항목',
        key: 'itemName',
        render: (_value: unknown, record: IndividualSettlementReviewItem) =>
          isIndividualSettlementLodgingType(record.itemType)
            ? `${record.itemName} (${INDIVIDUAL_SETTLEMENT_LODGING_NOT_PAYABLE_LABEL})`
            : record.itemName,
      },
      {
        title: '금액',
        key: 'amount',
        render: (_value: unknown, record: IndividualSettlementReviewItem) =>
          formatIndividualSettlementWon(record.amount),
      },
    ],
    []
  )

  const receiptColumns = useMemo(
    () => [
      {
        title: '지출 유형',
        key: 'expenseType',
        render: (_value: unknown, record: IndividualSettlementReviewReceipt) =>
          isIndividualSettlementLodgingType(record.expenseType)
            ? `${record.expenseType} (${INDIVIDUAL_SETTLEMENT_LODGING_NOT_PAYABLE_LABEL})`
            : record.expenseType,
      },
      {
        title: '지출일',
        key: 'expenseDate',
        render: (_value: unknown, record: IndividualSettlementReviewReceipt) =>
          formatIndividualSettlementDate(record.expenseDate),
      },
      {
        title: '금액',
        key: 'amount',
        render: (_value: unknown, record: IndividualSettlementReviewReceipt) =>
          formatIndividualSettlementWon(record.amount),
      },
      {
        title: '첨부파일',
        key: 'files',
        render: (_value: unknown, record: IndividualSettlementReviewReceipt) => (
          <div className="individual-settlement-review-detail-modal__file-list">
            {(record.files ?? []).length === 0
              ? '-'
              : (record.files ?? []).map(file => (
                  <CmsButton
                    key={file.fileObjectId}
                    variant="default"
                    size="small" className="individual-settlement-review-detail-modal__file-button"
                    onClick={() => void handleDownload(file)} >
                    {file.fileName}
                  </CmsButton>
                ))}
          </div>
        ),
      },
    ],
    [handleDownload]
  )

  const reviewing = approveMutation.isPending || rejectMutation.isPending

  return (
    <>
      <ContentModal
        open={open}
        onCancel={onClose}
        title="개인 정산 상세"
        size="wide"
        className="individual-settlement-review-detail-modal"
        footer={
          <div className="individual-settlement-review-detail-modal__footer">
            <CmsButton variant="secondary" size="large" type="button" onClick={onClose}>
              닫기
            </CmsButton>
            {canReject ? (
              <CmsButton
                variant="delete"
                size="large"
                type="button"
                disabled={reviewing}
                onClick={() => setRejectOpen(true)} >
                반려
              </CmsButton>
            ) : null}
            {canApprove ? (
              <CmsButton
                variant="primary"
                size="large"
                type="button"
                disabled={reviewing}
                onClick={() => setApproveOpen(true)} >
                승인
              </CmsButton>
            ) : null}
          </div>
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
        ) : !detail ? (
          <div className="individual-settlement-review-detail-modal__empty">
            개인 정산 상세가 없습니다.
          </div>
        ) : (
          <div className="individual-settlement-review-detail-modal__body">
            <DetailInfoForm title="" hideHeader mode="view">
              <DetailInfoForm.Row type="double">
                <DetailInfoForm.Field
                  label="신청 상태"
                  view={
                    <StatusBadge
                      domain="custom"
                      variant="text"
                      label={individualSettlementReviewStatusLabel(detail.status)}
                      accentColor={individualSettlementReviewStatusAccent(detail.status)}
                    />
                  }
                />
                <DetailInfoForm.Field
                  label="최신 Revision"
                  view={
                    detail.latestRevisionNo != null ? String(detail.latestRevisionNo) : '-'
                  }
                />
              </DetailInfoForm.Row>
              <DetailInfoForm.Row type="double">
                <DetailInfoForm.Field label="프로그램" view={detail.programName?.trim() || '-'} />
                <DetailInfoForm.Field
                  label="교육 일정"
                  view={scheduleLabel(detail.scheduleName)}
                />
              </DetailInfoForm.Row>
            </DetailInfoForm>

            {(detail.revisions ?? []).map(revision => (
              <section
                key={revision.revisionId}
                className="individual-settlement-review-detail-modal__revision"
              >
                <h3 className="individual-settlement-review-detail-modal__revision-title">
                  Revision {revision.revisionNo}
                </h3>
                <DetailInfoForm title="" hideHeader mode="view">
                  <DetailInfoForm.Row type="double">
                    <DetailInfoForm.Field
                      label="상태"
                      view={individualSettlementReviewStatusLabel(revision.status)}
                    />
                    <DetailInfoForm.Field
                      label="제출일"
                      view={formatIndividualSettlementDateTime(revision.submittedAt)}
                    />
                  </DetailInfoForm.Row>
                  <DetailInfoForm.Row type="double">
                    <DetailInfoForm.Field
                      label="심사일"
                      view={formatIndividualSettlementDateTime(revision.reviewedAt)}
                    />
                    <DetailInfoForm.Field
                      label="반려 사유"
                      view={revision.rejectionReason?.trim() || '-'}
                    />
                  </DetailInfoForm.Row>
                </DetailInfoForm>
                <CmsDataTable<IndividualSettlementReviewItem>
                  className="cms-data-table"
                  rowKey="itemId"
                  size="middle"
                  pagination={false}
                  columns={itemColumns}
                  dataSource={revision.items ?? []}
                />
                <CmsDataTable<IndividualSettlementReviewReceipt>
                  className="cms-data-table"
                  rowKey="receiptId"
                  size="middle"
                  pagination={false}
                  columns={receiptColumns}
                  dataSource={(revision.items ?? []).flatMap(item => item.receipts ?? [])}
                />
              </section>
            ))}
          </div>
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
              disabled={rejectMutation.isPending} >
              취소
            </CmsButton>
            <CmsButton
              variant="delete"
              size="large"
              type="button"
              onClick={() => void handleReject()}
              loading={rejectMutation.isPending}
              disabled={rejectMutation.isPending || !rejectReason.trim()} >
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
    </>
  )
}
