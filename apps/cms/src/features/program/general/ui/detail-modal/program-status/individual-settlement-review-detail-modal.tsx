import { useMemo, useState } from 'react'
import { Input, Spin } from 'antd'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import { downloadAdminFile } from '@/shared/lib/admin-file-upload'
import {
  approveIndividualSettlementReviewRemote,
  fetchIndividualSettlementReviewDetailRemote,
  rejectIndividualSettlementReviewRemote,
} from '@/features/program/general/api/individual-settlement-review-remote'
import {
  formatIndividualSettlementAmount,
  INDIVIDUAL_SETTLEMENT_REVIEW_STATUS_LABELS,
  type IndividualSettlementReviewRowStatus,
} from '@/features/program/general/lib/map-individual-settlement-review-rows'
import type { IndividualSettlementReviewDetail } from '@/shared/api/generated/dashboard/schemas/individualSettlementReviewDetail'

function statusLabel(value?: string | null): string {
  const key = value?.trim().toUpperCase() as IndividualSettlementReviewRowStatus | undefined
  return key && key in INDIVIDUAL_SETTLEMENT_REVIEW_STATUS_LABELS
    ? INDIVIDUAL_SETTLEMENT_REVIEW_STATUS_LABELS[key]
    : value?.trim() || '-'
}

function totalRevisionAmount(detail?: IndividualSettlementReviewDetail | null): number {
  const latestNo = detail?.latestRevisionNo
  const revision = detail?.revisions?.find(item => item.revisionNo === latestNo) ?? detail?.revisions?.at(-1)
  return (revision?.items ?? []).reduce((total, item) => total + (item.amount ?? 0), 0)
}

export function IndividualSettlementReviewDetailModal(props: {
  open: boolean
  settlementApplicationId?: number
  onClose: () => void
  onChanged: () => Promise<void>
}) {
  const { showAlert } = useCmsAlert()
  const [rejectMode, setRejectMode] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [downloadingFileId, setDownloadingFileId] = useState<number | null>(null)
  const id = props.settlementApplicationId

  const detailQuery = useQuery({
    queryKey: ['individual-settlement-review-detail', id],
    enabled: props.open && id != null,
    queryFn: () => fetchIndividualSettlementReviewDetailRemote(id!),
    retry: false,
  })

  const approveMutation = useMutation({
    mutationFn: () =>
      approveIndividualSettlementReviewRemote(
        id!,
        detailQuery.data?.latestRevisionNo ?? 0
      ),
    onSuccess: async () => {
      await props.onChanged()
      props.onClose()
      showAlert({ title: '완료', content: '개인 정산 신청을 승인했습니다.' })
    },
    onError: () => showAlert({ title: '안내', content: '승인 처리에 실패했습니다. 최신 상태를 다시 확인해 주세요.' }),
  })

  const rejectMutation = useMutation({
    mutationFn: () =>
      rejectIndividualSettlementReviewRemote(id!, {
        expectedRevisionNo: detailQuery.data?.latestRevisionNo ?? 0,
        reason: rejectReason.trim(),
      }),
    onSuccess: async () => {
      await props.onChanged()
      props.onClose()
      setRejectMode(false)
      setRejectReason('')
      showAlert({ title: '완료', content: '개인 정산 신청을 반려했습니다.' })
    },
    onError: () => showAlert({ title: '안내', content: '반려 처리에 실패했습니다. 최신 상태를 다시 확인해 주세요.' }),
  })

  const detail = detailQuery.data
  const latestRevision = useMemo(
    () => detail?.revisions?.find(item => item.revisionNo === detail.latestRevisionNo) ?? detail?.revisions?.at(-1),
    [detail]
  )

  const handleDownload = async (fileObjectId: number, fileName: string) => {
    if (downloadingFileId != null) return
    setDownloadingFileId(fileObjectId)
    try {
      await downloadAdminFile({ fileObjectId, fileName })
    } catch {
      showAlert({ title: '안내', content: '증빙파일 다운로드에 실패했습니다.' })
    } finally {
      setDownloadingFileId(null)
    }
  }

  const canReview = detail?.status?.trim().toUpperCase() === 'SUBMITTED' && latestRevision != null
  const loading = detailQuery.isPending || approveMutation.isPending || rejectMutation.isPending

  return (
    <ContentModal
      open={props.open}
      onCancel={props.onClose}
      title="개인 정산 신청 상세"
      size="wide"
      footer={
        <>
          <CmsButton variant="secondary" size="medium" onClick={props.onClose} disabled={loading}>
            닫기
          </CmsButton>
          {canReview && !rejectMode ? (
            <>
              <CmsButton
                variant="error"
                size="medium"
                onClick={() => setRejectMode(true)}
                disabled={loading}
              >
                반려
              </CmsButton>
              <CmsButton
                variant="primary"
                size="medium"
                onClick={() => approveMutation.mutate()}
                loading={approveMutation.isPending}
              >
                승인
              </CmsButton>
            </>
          ) : null}
          {canReview && rejectMode ? (
            <CmsButton
              variant="error"
              size="medium"
              onClick={() => rejectMutation.mutate()}
              loading={rejectMutation.isPending}
              disabled={!rejectReason.trim()}
            >
              반려 확정
            </CmsButton>
          ) : null}
        </>
      }
    >
      {detailQuery.isError ? (
        <div role="alert">개인 정산 신청 상세를 불러오지 못했습니다.</div>
      ) : (
        <Spin spinning={loading}>
          <div className="individual-settlement-review-detail">
            <dl className="individual-settlement-review-detail__summary">
              <div><dt>상태</dt><dd>{statusLabel(detail?.status)}</dd></div>
              <div><dt>일정</dt><dd>{detail?.scheduleName?.trim() || '-'}</dd></div>
              <div><dt>최신 Revision</dt><dd>{detail?.latestRevisionNo ?? '-'}</dd></div>
              <div><dt>최신 제출 합계</dt><dd>{formatIndividualSettlementAmount(totalRevisionAmount(detail))}</dd></div>
            </dl>

            {rejectMode ? (
              <div className="individual-settlement-review-detail__reject">
                <label htmlFor="individual-settlement-reject-reason">반려 사유</label>
                <Input.TextArea
                  id="individual-settlement-reject-reason"
                  rows={3}
                  value={rejectReason}
                  onChange={event => setRejectReason(event.target.value)}
                  placeholder="반려 사유를 입력해 주세요."
                  maxLength={4000}
                />
              </div>
            ) : null}

            <div className="individual-settlement-review-detail__revisions">
              {(detail?.revisions ?? []).map(revision => (
                <section key={revision.revisionId}>
                  <h4>Revision {revision.revisionNo} · {statusLabel(revision.status)}</h4>
                  {revision.rejectionReason ? <p>반려 사유: {revision.rejectionReason}</p> : null}
                  {(revision.items ?? []).map(item => (
                    <div key={item.itemId} className="individual-settlement-review-detail__item">
                      <div className="individual-settlement-review-detail__item-heading">
                        <strong>{item.itemName || item.itemType}</strong>
                        <span>{formatIndividualSettlementAmount(item.amount)}</span>
                      </div>
                      {(item.receipts ?? []).map(receipt => (
                        <div key={receipt.receiptId} className="individual-settlement-review-detail__receipt">
                          <span>{receipt.expenseType} · {receipt.expenseDate}</span>
                          <span>{formatIndividualSettlementAmount(receipt.amount)}</span>
                          {(receipt.files ?? []).map(file => (
                            <CmsButton
                              key={file.fileObjectId}
                              variant="default"
                              size="small"
                              onClick={() => void handleDownload(file.fileObjectId, file.fileName)}
                              loading={downloadingFileId === file.fileObjectId}
                            >
                              {file.fileName}
                            </CmsButton>
                          ))}
                        </div>
                      ))}
                    </div>
                  ))}
                </section>
              ))}
            </div>
          </div>
        </Spin>
      )}
    </ContentModal>
  )
}
