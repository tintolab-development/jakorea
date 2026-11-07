import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import { CalculationDetailViewButton } from '@/features/settlement/ui/payment-record/calculation-detail-view-button'
import { showNotificationResendRequestCompletedAlert, useCmsAlert } from '@/shared/ui'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { getInstructorSettlementInvoiceStatusPresentation } from '@/shared/constants/instructor-settlement-status'
import type {
  InstructorSettlementInvoiceLineItem,
  InstructorSettlementListRow,
} from '@/features/user/detail/model/instructor-settlement-types'
import { PaymentOrderPaymentConfirmationModal } from '@/features/settlement/ui/payment-record/payment-order-payment-confirmation-modal'
import { PaymentOrderPaymentConfirmationResultModal } from '@/features/settlement/ui/payment-record/payment-order-payment-confirmation-result-modal'
import { PaymentOrderPaymentRejectionModal } from '@/features/settlement/ui/payment-record/payment-order-payment-rejection-modal'
import { PaymentOrderPaymentRejectionResultModal } from '@/features/settlement/ui/payment-record/payment-order-payment-rejection-result-modal'
import {
  PaymentOrderCalculationBasisDetailModal,
  usePaymentOrderCalculationBasisDetailModal,
} from '@/features/settlement/ui/payment-record/payment-order-calculation-basis-detail-modal'
import { computePaymentOrderCalculationSubtotalBeforeWithholding } from '@/features/settlement/ui/payment-record/payment-order-calculation-basis-detail'
import type { PaymentOrderCalculationTableRow } from '@/features/settlement/ui/payment-record/payment-order-calculation-breakdown-table'
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
import { useResendSettlementNotificationMutation } from '@/features/settlement-management/hooks/use-resend-settlement-notification-mutation'
import { SettlementNotificationResendModal } from '@/features/settlement/ui/payment-record/settlement-notification-resend-modal'
import { SendNotiButton } from '@/features/program/shared/ui/detail-modal/components/send-noti-button'
import {
  canResendInstructorInvoiceNotification,
  resolveInstructorInvoiceNotificationResendKind,
} from '@/features/settlement/lib/settlement-notification-resend'
import type { PaymentOrderRejectSubmitPayload } from '@/features/settlement/lib/payment-order-reject-notification'
import {
  getSettlementApiErrorMessage,
  isFileDownloadPasswordApiError,
} from '@/features/settlement-management/api/get-settlement-api-error'
import { mapSettlementDetailToInstructorInvoice } from '@/features/user/api/map-settlement-to-instructor-member-row'
import { useProtectedFileDownload } from '@/shared/lib/use-protected-file-download'
import { ButtonDownloadIcon } from '@/shared/ui/icons/ButtonIcons'
import '@/features/program/shared/ui/program-detail/applicant-list/applicant-institution-basic-info.css'
import './instructor-invoice-modal.css'

function buildBasisDetailTableRow(input: {
  lineId: string
  item: Pick<
    InstructorSettlementInvoiceLineItem,
    '산정항목' | '항목설명' | '정산금액' | 'isPositive' | 'kind' | 'basisDetail'
  >
  institutionName: string
  lectureDateDisplay: string
  lectureSessionDisplay: string
}): PaymentOrderCalculationTableRow {
  const amount =
    input.item.isPositive === false ? -Math.abs(input.item.정산금액) : input.item.정산금액
  return {
    key: input.lineId,
    blockRowSpan: 1,
    isFirstInBlock: true,
    institutionName: input.institutionName,
    lectureDateDisplay: input.lectureDateDisplay,
    lectureSessionDisplay: input.lectureSessionDisplay,
    itemLabel: input.item.산정항목,
    description: input.item.항목설명,
    amount,
    lineId: input.lineId,
    kind: input.item.kind ?? 'lecture_fee',
    basisDetail: input.item.basisDetail,
  }
}

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
  const { showAlert } = useCmsAlert()
  const { runProtectedDownload, filePasswordModal } = useProtectedFileDownload()
  const confirmMutation = useConfirmPaymentStatementMutation()
  const rejectMutation = useRejectPaymentStatementMutation()
  const resendNotificationMutation = useResendSettlementNotificationMutation()
  const resendIdempotencyKeyRef = useRef<string | null>(null)
  const [notificationResendOpen, setNotificationResendOpen] = useState(false)
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
    return mapSettlementDetailToInstructorInvoice(settlementDetailQuery.data, listItem, row.status)
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

  const basisDetailContext = useMemo(() => {
    if (!statementData || statementData.context !== 'program') return null
    const subtotalBeforeWithholding = computePaymentOrderCalculationSubtotalBeforeWithholding(
      statementData.blocks
    )
    return {
      lectureFeeStandardTitle: statementData.basic.lectureFeeStandardTitle,
      withholdingDailySalaryTotalWon:
        subtotalBeforeWithholding > 0 ? subtotalBeforeWithholding : undefined,
      remoteData: true,
    }
  }, [statementData])

  const { basisDetailOpen, selectedBasisDetail, handleBasisDetailClick, closeBasisDetailModal } =
    usePaymentOrderCalculationBasisDetailModal(open, basisDetailContext)

  const lectureDateParts = useMemo(() => {
    const raw = effectiveRow?.invoice.lectureDateSessions ?? '-'
    const parts = raw.split('|').map(s => s.trim())
    if (parts.length >= 2) {
      return { lectureDateDisplay: parts[0], lectureSessionDisplay: parts[1] }
    }
    return { lectureDateDisplay: raw, lectureSessionDisplay: '-' }
  }, [effectiveRow?.invoice.lectureDateSessions])

  useEffect(() => {
    if (!open) {
      setPaymentConfirmOpen(false)
      setPaymentConfirmDoneOpen(false)
      setPaymentRejectOpen(false)
      setPaymentRejectDoneOpen(false)
      setPaymentRejectReason('')
      setNotificationResendOpen(false)
      resendIdempotencyKeyRef.current = null
    }
  }, [open])

  const paymentStatementPresentation = effectiveRow?.invoice
    ? getInstructorSettlementInvoiceStatusPresentation(effectiveRow.invoice.paymentStatementStatus)
    : null

  /** 확인·반려는 WAITING_CONFIRM|REAPPLICATION만 가능 — 확인 완료·지급 완료에서는 CTA 숨김 */
  const hideStatementActionButtons =
    effectiveRow?.invoice.paymentStatementStatus === 'payment_statement_verified' ||
    effectiveRow?.invoice.paymentStatementStatus === 'account_paid'
  const invoiceResendKind = effectiveRow
    ? resolveInstructorInvoiceNotificationResendKind(effectiveRow.invoice.paymentStatementStatus)
    : null
  const canResendInvoiceNotification =
    settlementId != null &&
    invoiceResendKind != null &&
    effectiveRow != null &&
    canResendInstructorInvoiceNotification(
      effectiveRow.invoice.paymentStatementStatus,
      settlementDetailQuery.data?.availableActions
    )

  const handleRemoteConfirm = async (lectureFeePaymentScheduledDateIso: string) => {
    const statementId = statementIdQuery.data
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
      setPaymentConfirmOpen(false)
      setPaymentConfirmDoneOpen(true)
      onSettlementUpdated?.()
    } catch (error) {
      showAlert({
        title: '안내',
        content: getSettlementApiErrorMessage(error, '지급조서 확인 처리에 실패했습니다.'),
      })
    }
  }

  const handleRemoteReject = async (payload: PaymentOrderRejectSubmitPayload) => {
    const statementId = statementIdQuery.data
    if (statementId == null) {
      showAlert({
        title: '안내',
        content: '지급조서 반려 API에 필요한 statementId가 없습니다.',
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
      setPaymentRejectOpen(false)
      setPaymentRejectReason(payload.reason)
      setPaymentRejectDoneOpen(true)
      onSettlementUpdated?.()
    } catch (error) {
      showAlert({
        title: '안내',
        content: getSettlementApiErrorMessage(error, '지급조서 반려 처리에 실패했습니다.'),
      })
    }
  }

  const handleDownloadPaymentStatement = () => {
    if (settlementId == null) return
    runProtectedDownload({
      kind: 'PAYMENT_STATEMENT',
      zIndex: 1400,
      download: async password => {
        setDownloadLoading(true)
        try {
          await downloadPaymentStatementRemote(settlementId, { password })
        } catch (error) {
          if (!isFileDownloadPasswordApiError(error)) {
            showAlert({
              title: '안내',
              content: getSettlementApiErrorMessage(error, '지급조서 다운로드에 실패했습니다.'),
            })
          }
          throw error
        } finally {
          setDownloadLoading(false)
        }
      },
    })
  }

  const showLineActions = Boolean(statementData && statementIdQuery.data != null)

  return (
    <>
      {filePasswordModal}
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
                          <span className="applicant-institution-basic-info__approval-status-row">
                            <span
                              style={{ color: paymentStatementPresentation.color, fontWeight: 600 }}
                            >
                              {paymentStatementPresentation.label}
                            </span>
                            {canResendInvoiceNotification ? (
                              <>
                                <span
                                  className="applicant-institution-basic-info__approval-status-vbar"
                                  aria-hidden
                                />
                                <SendNotiButton
                                  mode="resend"
                                  onClick={() => setNotificationResendOpen(true)}
                                />
                              </>
                            ) : null}
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
                        label="강사비 책정 기준"
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
                  {showLineActions && !hideStatementActionButtons ? (
                    <div className="instructor-invoice-modal__statement-actions-row" role="toolbar">
                      <CmsButton
                        variant="delete"
                        size="large"
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
                        size="large"
                        onClick={() => setPaymentConfirmOpen(true)}
                      >
                        확인 처리
                      </CmsButton>
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
                              <td>
                                <div className="instructor-invoice-modal__basis-detail-btn-wrap">
                                  <CalculationDetailViewButton
                                    onClick={() =>
                                      handleBasisDetailClick(
                                        buildBasisDetailTableRow({
                                          lineId: `${effectiveRow.id}-${item.key}`,
                                          item,
                                          institutionName: effectiveRow.invoice.institutionName,
                                          ...lectureDateParts,
                                        })
                                      )
                                    }
                                  />
                                </div>
                              </td>
                            </tr>
                          ))}
                          <tr>
                            <td>원천징수</td>
                            <td>원천징수 {effectiveRow.invoice.withholdingRatePercent}%</td>
                            <td className="instructor-invoice-modal__amount--minus">
                              -{effectiveRow.invoice.withholdingAmount.toLocaleString()}원
                            </td>
                            <td>
                              <div className="instructor-invoice-modal__basis-detail-btn-wrap">
                                <CalculationDetailViewButton
                                  onClick={() =>
                                    handleBasisDetailClick(
                                      buildBasisDetailTableRow({
                                        lineId: `${effectiveRow.id}-withholding`,
                                        item: {
                                          산정항목: '원천징수',
                                          항목설명: `원천징수 ${effectiveRow.invoice.withholdingRatePercent}%`,
                                          정산금액: effectiveRow.invoice.withholdingAmount,
                                          isPositive: false,
                                          kind: 'withholding',
                                          basisDetail: effectiveRow.invoice.withholdingBasisDetail,
                                        },
                                        institutionName: effectiveRow.invoice.institutionName,
                                        ...lectureDateParts,
                                      })
                                    )
                                  }
                                />
                              </div>
                            </td>
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
                              icon={<ButtonDownloadIcon />}
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
      <PaymentOrderCalculationBasisDetailModal
        open={basisDetailOpen}
        detail={selectedBasisDetail}
        onCancel={closeBasisDetailModal}
        zIndex={1400}
      />
      {invoiceResendKind != null ? (
        <SettlementNotificationResendModal
          open={notificationResendOpen}
          kind={invoiceResendKind}
          hasStoredRejectionReason={Boolean(paymentRejectReason.trim())}
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
                    invoiceResendKind === 'rejected' ? payload.reason.trim() || null : null,
                },
              })
              .then(() => {
                resendIdempotencyKeyRef.current = null
                setNotificationResendOpen(false)
                showNotificationResendRequestCompletedAlert()
                onSettlementUpdated?.()
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
