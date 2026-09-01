import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { DownloadOutlined } from '@ant-design/icons'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton, CMS_ACTION_BUTTON_WIDTH } from '@/shared/ui/cms-button'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { getInstructorSettlementInvoiceStatusPresentation } from '@/shared/constants/instructor-settlement-status'
import type { InstructorSettlementListRow } from '@/features/user/detail/model/instructor-settlement-types'
import { PaymentOrderPaymentConfirmationModal } from '@/features/settlement/ui/payment-record/payment-order-payment-confirmation-modal'
import { PaymentOrderPaymentConfirmationResultModal } from '@/features/settlement/ui/payment-record/payment-order-payment-confirmation-result-modal'
import { PaymentOrderPaymentRejectionModal } from '@/features/settlement/ui/payment-record/payment-order-payment-rejection-modal'
import { PaymentOrderPaymentRejectionResultModal } from '@/features/settlement/ui/payment-record/payment-order-payment-rejection-result-modal'
import { buildPaymentOrderStatementFromInstructorInvoice } from '@/features/user/detail/lib/instructor-invoice-payment-statement-bridge'
import {
  downloadPaymentStatementRemote,
  fetchSettlementDetailRemote,
  resolvePaymentStatementIdForSettlement,
} from '@/features/settlement-management/api/settlement-api-client'
import {
  useConfirmPaymentStatementMutation,
  useRejectPaymentStatementMutation,
} from '@/features/settlement-management/hooks/use-confirm-payment-statement-mutation'
import type { PaymentOrderRejectSubmitPayload } from '@/features/settlement/lib/payment-order-reject-notification'
import { getSettlementApiErrorMessage } from '@/features/settlement-management/api/get-settlement-api-error'
import {
  mapSettlementDetailToInstructorInvoice,
} from '@/features/user/api/map-settlement-to-instructor-member-row'
import { downloadFromBulkEndpoint } from '@/features/user/api/download-bulk-endpoint'
import './instructor-invoice-modal.css'

export interface InstructorInvoiceModalProps {
  open: boolean
  onClose: () => void
  row: InstructorSettlementListRow | null
  instructorNameKo?: string
  onSettlementUpdated?: () => void
}

export function InstructorInvoiceModal({
  open,
  onClose,
  row,
  instructorNameKo = '',
  onSettlementUpdated,
}: InstructorInvoiceModalProps) {
  const confirmMutation = useConfirmPaymentStatementMutation()
  const rejectMutation = useRejectPaymentStatementMutation()
  const [paymentConfirmOpen, setPaymentConfirmOpen] = useState(false)
  const [paymentConfirmDoneOpen, setPaymentConfirmDoneOpen] = useState(false)
  const [paymentRejectOpen, setPaymentRejectOpen] = useState(false)
  const [paymentRejectDoneOpen, setPaymentRejectDoneOpen] = useState(false)
  const [paymentRejectReason, setPaymentRejectReason] = useState('')
  const [downloadLoading, setDownloadLoading] = useState(false)

  const settlementId = row?.settlementId
  const trimmedName = instructorNameKo.trim() || row?.instructorName?.trim() || '강사'

  const settlementDetailQuery = useQuery({
    queryKey: ['instructor-settlement-detail', settlementId],
    enabled: open && settlementId != null,
    queryFn: () => fetchSettlementDetailRemote(settlementId!),
  })

  const statementIdQuery = useQuery({
    queryKey: ['instructor-settlement-statement-id', settlementId, row?.statementId],
    enabled: open && settlementId != null,
    queryFn: async () => {
      if (row?.statementId != null) return row.statementId
      return resolvePaymentStatementIdForSettlement(settlementId!)
    },
  })

  const invoiceData = useMemo(() => {
    if (!row || !settlementDetailQuery.data) return row?.invoice ?? null
    const listItem = {
      settlementId: row.settlementId,
      programNameKo: row.programName,
      lectureDate: row.calendarDate,
      expectedTransferDate: row.invoice.expectedTransferDate,
      netPaymentAmount: row.scheduledAmount,
      grossAmount: row.scheduledAmount,
      withholdingTaxAmount: row.invoice.withholdingAmount,
      taxIncomeType: row.invoice.lectureFeeBasis,
      statementStatus: undefined,
      paymentStatus: undefined,
    }
    return mapSettlementDetailToInstructorInvoice(
      settlementDetailQuery.data,
      listItem,
      row.status
    )
  }, [row, settlementDetailQuery.data])

  const effectiveRow = useMemo(() => {
    if (!row || !invoiceData) return row
    return { ...row, invoice: invoiceData }
  }, [row, invoiceData])

  const statementData = useMemo(() => {
    if (!effectiveRow?.invoice) return null
    return buildPaymentOrderStatementFromInstructorInvoice(
      effectiveRow.invoice,
      effectiveRow.id,
      trimmedName
    )
  }, [effectiveRow, trimmedName])

  useEffect(() => {
    if (!open) {
      setPaymentConfirmOpen(false)
      setPaymentConfirmDoneOpen(false)
      setPaymentRejectOpen(false)
      setPaymentRejectDoneOpen(false)
      setPaymentRejectReason('')
    }
  }, [open])

  const paymentStatementPresentation = effectiveRow?.invoice
    ? getInstructorSettlementInvoiceStatusPresentation(effectiveRow.invoice.paymentStatementStatus)
    : null

  const hideConfirmButton =
    effectiveRow?.invoice.paymentStatementStatus === 'payment_statement_verified' ||
    effectiveRow?.invoice.paymentStatementStatus === 'account_paid'

  const handleRemoteConfirm = async (lectureFeePaymentScheduledDateIso: string) => {
    const statementId = statementIdQuery.data
    if (statementId == null) {
      window.alert('지급조서 확인 API에 필요한 statementId가 없습니다.')
      return
    }
    try {
      await confirmMutation.mutateAsync({
        statementIds: [statementId],
        lectureFeePaymentScheduledDate: lectureFeePaymentScheduledDateIso,
      })
      setPaymentConfirmOpen(false)
      setPaymentConfirmDoneOpen(true)
      onSettlementUpdated?.()
    } catch (error) {
      window.alert(getSettlementApiErrorMessage(error, '지급조서 확인 처리에 실패했습니다.'))
    }
  }

  const handleRemoteReject = async (payload: PaymentOrderRejectSubmitPayload) => {
    const statementId = statementIdQuery.data
    if (statementId == null) {
      window.alert('지급조서 반려 API에 필요한 statementId가 없습니다.')
      return
    }
    try {
      await rejectMutation.mutateAsync({
        statementId,
        reason: payload.reason,
        notificationType: payload.notificationType,
        scheduledNotificationAt: payload.scheduledNotificationAt,
      })
      setPaymentRejectOpen(false)
      setPaymentRejectReason(payload.reason)
      setPaymentRejectDoneOpen(true)
      onSettlementUpdated?.()
    } catch (error) {
      window.alert(getSettlementApiErrorMessage(error, '지급조서 반려 처리에 실패했습니다.'))
    }
  }

  const handleDownloadPaymentStatement = async () => {
    if (settlementId == null) return
    setDownloadLoading(true)
    try {
      const doc = await downloadPaymentStatementRemote(settlementId)
      if (doc.downloadUrl) {
        await downloadFromBulkEndpoint(doc.downloadUrl, `지급조서_${settlementId}`, 'pdf')
      }
    } catch (error) {
      window.alert(getSettlementApiErrorMessage(error, '지급조서 다운로드에 실패했습니다.'))
    } finally {
      setDownloadLoading(false)
    }
  }

  const showLineActions = Boolean(statementData && statementIdQuery.data != null)

  return (
    <>
      {open && effectiveRow && paymentStatementPresentation ? (
        <ContentModal
          open={open}
          onCancel={onClose}
          title="산출 내역서"
          size="large"
          className="instructor-invoice-modal"
          footer={
            <div className="instructor-invoice-modal__modal-footer">
              <CmsButton variant="secondary" size="medium" onClick={onClose}>
                닫기
              </CmsButton>
            </div>
          }
        >
          {settlementDetailQuery.isLoading ? (
            <div className="instructor-invoice-modal__loading">로딩 중...</div>
          ) : (
            <>
              <section>
                <div className="instructor-invoice-modal__basic-group">
                  <DetailInfoForm
                    title="기본 정보"
                    className="instructor-invoice-modal__detail-form-card"
                  >
                    <DetailInfoForm.Row type="double">
                      <DetailInfoForm.Field
                        label="프로그램명"
                        view={<span>{effectiveRow.invoice.programName}</span>}
                      />
                      <DetailInfoForm.Field
                        label="사업 운영 기간"
                        view={<span>{effectiveRow.invoice.operationPeriod}</span>}
                      />
                    </DetailInfoForm.Row>
                    <DetailInfoForm.Row type="double">
                      <DetailInfoForm.Field
                        label="프로그램 진행 회차"
                        view={<span>{effectiveRow.invoice.sessionProgress}</span>}
                      />
                      <DetailInfoForm.Field
                        label="지급조서 처리 현황"
                        view={
                          <span style={{ color: paymentStatementPresentation.color, fontWeight: 600 }}>
                            {paymentStatementPresentation.label}
                          </span>
                        }
                      />
                    </DetailInfoForm.Row>
                    <DetailInfoForm.Row type="double">
                      <DetailInfoForm.Field
                        label="이체 예정일"
                        view={<span>{effectiveRow.invoice.expectedTransferDate}</span>}
                      />
                      <DetailInfoForm.Field
                        label="강의비 책정 기준"
                        view={<span>{effectiveRow.invoice.lectureFeeBasis}</span>}
                      />
                    </DetailInfoForm.Row>
                    <DetailInfoForm.Row type="single">
                      <DetailInfoForm.Field
                        label="사업소득자 여부"
                        view={<span>{effectiveRow.invoice.businessIncomeEarner}</span>}
                      />
                    </DetailInfoForm.Row>
                  </DetailInfoForm>
                </div>
              </section>

              <section>
                <div className="info-section-wrapper" style={{ marginBottom: '16px' }}>
                  <div>
                    <span className="info-section-title">산출 내역 상세</span>
                    <span className="info-section-description">
                      교통비 및 숙소비는 강사가 지급 신청한 경우에만 항목 노출됩니다.
                    </span>
                  </div>
                  {showLineActions ? (
                    <div className="instructor-invoice-modal__statement-actions-row" role="toolbar">
                      <CmsButton
                        variant="delete"
                        size="large"
                        className="cms-button--action"
                        width={CMS_ACTION_BUTTON_WIDTH}
                        onClick={() => setPaymentRejectOpen(true)}
                      >
                        신청 반려
                      </CmsButton>
                      {!hideConfirmButton ? (
                        <CmsButton
                          variant="primary"
                          size="large"
                          className="cms-button--action"
                          width={CMS_ACTION_BUTTON_WIDTH}
                          onClick={() => setPaymentConfirmOpen(true)}
                        >
                          확인 처리
                        </CmsButton>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <div className="instructor-invoice-modal__detail-card">
                  <table className="instructor-invoice-modal__detail-table">
                    <thead>
                      <tr>
                        <th style={{ width: '14%' }}>참여 기관명</th>
                        <th style={{ width: '18%' }}>강의 진행 일자</th>
                        <th style={{ width: '10%' }}>산정 항목</th>
                        <th style={{ width: '22%' }}>항목 설명</th>
                        <th style={{ width: '12%' }}>정산 금액</th>
                        <th style={{ width: '14%' }}>산정 기준 상세</th>
                      </tr>
                    </thead>
                    <tbody>
                      {effectiveRow.invoice.lineItems.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', color: '#9ca3af' }}>
                            산출 항목이 없습니다.
                          </td>
                        </tr>
                      ) : (
                        <>
                          {effectiveRow.invoice.lineItems.map((item, idx) => (
                            <tr key={item.key}>
                              {idx === 0 ? (
                                <td rowSpan={effectiveRow.invoice.lineItems.length + 1}>
                                  {effectiveRow.invoice.institutionName}
                                </td>
                              ) : null}
                              {idx === 0 ? (
                                <td rowSpan={effectiveRow.invoice.lineItems.length + 1}>
                                  {effectiveRow.invoice.lectureDateSessions}
                                </td>
                              ) : null}
                              <td>{item.산정항목}</td>
                              <td>{item.항목설명}</td>
                              <td
                                className={
                                  item.isPositive !== false
                                    ? 'instructor-invoice-modal__amount--plus'
                                    : 'instructor-invoice-modal__amount--minus'
                                }
                              >
                                {item.isPositive !== false ? '+' : ''}
                                {item.정산금액.toLocaleString()}원
                              </td>
                              <td>-</td>
                            </tr>
                          ))}
                          <tr>
                            <td>원천징수</td>
                            <td>원천징수 {effectiveRow.invoice.withholdingRatePercent}%</td>
                            <td className="instructor-invoice-modal__amount--minus">
                              -{effectiveRow.invoice.withholdingAmount.toLocaleString()}원
                            </td>
                            <td>-</td>
                          </tr>
                        </>
                      )}
                      <tr className="instructor-invoice-modal__footer-row">
                        <td colSpan={3}>
                          <strong>합계</strong>
                        </td>
                        <td>{effectiveRow.invoice.totalFormulaLabel}</td>
                        <td className="instructor-invoice-modal__total-amount">
                          {effectiveRow.invoice.totalAmount.toLocaleString()}원
                        </td>
                        <td>
                          <div className="instructor-invoice-modal__footer-actions">
                            <CmsButton
                              variant="primary"
                              size="large"
                              width={160}
                              icon={<DownloadOutlined />}
                              loading={downloadLoading}
                              onClick={() => void handleDownloadPaymentStatement()}
                            >
                              지급조서 발급
                            </CmsButton>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </ContentModal>
      ) : null}

      <PaymentOrderPaymentConfirmationModal
        open={paymentConfirmOpen}
        onCancel={() => setPaymentConfirmOpen(false)}
        onConfirm={payload => void handleRemoteConfirm(payload.lectureFeePaymentScheduledDateIso)}
        data={statementData}
      />
      <PaymentOrderPaymentConfirmationResultModal
        open={paymentConfirmDoneOpen}
        onClose={() => setPaymentConfirmDoneOpen(false)}
      />
      <PaymentOrderPaymentRejectionModal
        open={paymentRejectOpen}
        onCancel={() => setPaymentRejectOpen(false)}
        onReject={payload => void handleRemoteReject(payload)}
        data={statementData}
        confirmLoading={rejectMutation.isPending}
      />
      <PaymentOrderPaymentRejectionResultModal
        open={paymentRejectDoneOpen}
        onClose={() => setPaymentRejectDoneOpen(false)}
        data={statementData}
        reason={paymentRejectReason}
      />
    </>
  )
}
