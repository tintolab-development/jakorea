import { useEffect, useMemo, useState } from 'react'
import { DownloadOutlined } from '@ant-design/icons'
import { PlainHeaderModal } from '@/shared/ui/plain-header-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import {
  getInstructorSettlementInvoiceStatusPresentation,
  type InstructorSettlementInvoiceDetail,
  type InstructorSettlementUiStatus,
} from '@/data/mock/instructor-member-settlements'
import { PaymentOrderPaymentConfirmationModal } from '@/features/settlement/ui/payment-record/payment-order-payment-confirmation-modal'
import { PaymentOrderPaymentConfirmationResultModal } from '@/features/settlement/ui/payment-record/payment-order-payment-confirmation-result-modal'
import { PaymentOrderPaymentRejectionModal } from '@/features/settlement/ui/payment-record/payment-order-payment-rejection-modal'
import { PaymentOrderPaymentRejectionResultModal } from '@/features/settlement/ui/payment-record/payment-order-payment-rejection-result-modal'
import { buildPaymentOrderStatementFromInstructorInvoice } from '@/features/user/detail/lib/instructor-invoice-payment-statement-bridge'
import './instructor-invoice-modal.css'

export interface InstructorInvoiceModalProps {
  open: boolean
  onClose: () => void
  data: InstructorSettlementInvoiceDetail | null
  /** 정산 목록 행 id — 지급조서 확인/반려 모달 payload용 */
  settlementLineRowId?: string | null
  /** 확인·반려 모달에 표시할 강사명 */
  instructorNameKo?: string
  /** 지급조서 확인 완료 시 상위 목록 상태 동기화 */
  onPaymentStatementConfirmed?: (settlementLineRowId: string) => void
}

export function InstructorInvoiceModal({
  open,
  onClose,
  data,
  settlementLineRowId,
  instructorNameKo = '',
  onPaymentStatementConfirmed,
}: InstructorInvoiceModalProps) {
  const [paymentConfirmOpen, setPaymentConfirmOpen] = useState(false)
  const [paymentConfirmDoneOpen, setPaymentConfirmDoneOpen] = useState(false)
  const [paymentRejectOpen, setPaymentRejectOpen] = useState(false)
  const [paymentRejectDoneOpen, setPaymentRejectDoneOpen] = useState(false)
  const [paymentRejectReason, setPaymentRejectReason] = useState('')
  const [currentPaymentStatementStatus, setCurrentPaymentStatementStatus] =
    useState<InstructorSettlementUiStatus>('awaiting_confirmation')

  const trimmedRowId = settlementLineRowId?.trim() ?? ''
  const trimmedName = instructorNameKo.trim() || '강사'

  const effectivePaymentStatementStatus: InstructorSettlementUiStatus =
    data?.paymentStatementStatus === 'account_paid'
      ? 'account_paid'
      : currentPaymentStatementStatus

  const effectiveInvoiceData = useMemo(() => {
    if (!data) return null
    return {
      ...data,
      paymentStatementStatus: effectivePaymentStatementStatus,
    }
  }, [data, effectivePaymentStatementStatus])

  const statementData = useMemo(() => {
    if (!effectiveInvoiceData || !trimmedRowId) return null
    return buildPaymentOrderStatementFromInstructorInvoice(
      effectiveInvoiceData,
      trimmedRowId,
      trimmedName
    )
  }, [effectiveInvoiceData, trimmedRowId, trimmedName])

  /* eslint-disable react-hooks/set-state-in-effect -- 산출 내역서 닫힘과 자식 모달 동기화 */
  useEffect(() => {
    if (!open) {
      setPaymentConfirmOpen(false)
      setPaymentConfirmDoneOpen(false)
      setPaymentRejectOpen(false)
      setPaymentRejectDoneOpen(false)
      setPaymentRejectReason('')
    }
  }, [open])
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    setCurrentPaymentStatementStatus(data?.paymentStatementStatus ?? 'awaiting_confirmation')
  }, [data?.paymentStatementStatus, settlementLineRowId])

  const paymentStatementPresentation = effectiveInvoiceData
    ? getInstructorSettlementInvoiceStatusPresentation(effectiveInvoiceData.paymentStatementStatus)
    : null

  const hideConfirmButton =
    effectiveInvoiceData?.paymentStatementStatus === 'payment_statement_verified' ||
    effectiveInvoiceData?.paymentStatementStatus === 'account_paid'

  const showLineActions = Boolean(statementData)

  return (
    <>
      {open && data && paymentStatementPresentation ? (
        <PlainHeaderModal
          open={open}
          onCancel={onClose}
          title="산출 내역서"
          size="large"
          className="instructor-invoice-modal"
          footer={
            <div className="instructor-invoice-modal__modal-footer">
              <CmsButton variant="default" size="medium" onClick={onClose}>
                닫기
              </CmsButton>
            </div>
          }
        >
          <section>
            <div className="instructor-invoice-modal__basic-group">
              <DetailInfoForm
                title="기본 정보"
                className="instructor-invoice-modal__detail-form-card"
              >
                <DetailInfoForm.Row type="double">
                  <DetailInfoForm.Field label="프로그램명" view={<span>{data.programName}</span>} />
                  <DetailInfoForm.Field
                    label="사업 운영 기간"
                    view={<span>{data.operationPeriod}</span>}
                  />
                </DetailInfoForm.Row>
                <DetailInfoForm.Row type="double">
                  <DetailInfoForm.Field
                    label="프로그램 진행 회차"
                    view={<span>{data.sessionProgress}</span>}
                  />
                  <DetailInfoForm.Field
                    label="지급조서 처리 현황"
                    view={
                      <div className="instructor-invoice-modal__payment-row">
                        <span
                          style={{
                            color: paymentStatementPresentation.color,
                            fontWeight: 600,
                          }}
                        >
                          {paymentStatementPresentation.label}
                        </span>
                        <span className="instructor-invoice-modal__payment-row-separator">|</span>
                        <CmsButton
                          variant="secondary"
                          size="large"
                          onClick={() => window.alert('준비 중입니다.')}
                        >
                          알림 발송
                        </CmsButton>
                      </div>
                    }
                  />
                </DetailInfoForm.Row>
                <DetailInfoForm.Row type="double">
                  <DetailInfoForm.Field
                    label="이체 예정일"
                    view={<span>{data.expectedTransferDate}</span>}
                  />
                  <DetailInfoForm.Field
                    label="강의비 책정 기준"
                    view={<span>{data.lectureFeeBasis}</span>}
                  />
                </DetailInfoForm.Row>
                <DetailInfoForm.Row type="single">
                  <DetailInfoForm.Field
                    label="사업소득자 여부"
                    view={<span>{data.businessIncomeEarner}</span>}
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
                    onClick={() => setPaymentRejectOpen(true)}
                  >
                    신청 반려
                  </CmsButton>
                  {!hideConfirmButton ? (
                    <CmsButton
                      variant="primary"
                      size="large"
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
                  {data.lineItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', color: '#9ca3af' }}>
                        산출 항목이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    <>
                      {data.lineItems.map((item, idx) => (
                        <tr key={item.key}>
                          {idx === 0 ? (
                            <td rowSpan={data.lineItems.length + 1}>{data.institutionName}</td>
                          ) : null}
                          {idx === 0 ? (
                            <td rowSpan={data.lineItems.length + 1}>{data.lectureDateSessions}</td>
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
                          <td className="instructor-invoice-modal__detail-action-cell">
                            <CmsButton
                              variant="secondary"
                              size="large"
                              onClick={() => window.alert('준비 중입니다.')}
                            >
                              상세 보기
                            </CmsButton>
                          </td>
                        </tr>
                      ))}
                      <tr>
                        <td>원천징수</td>
                        <td>원천징수 {data.withholdingRatePercent}%</td>
                        <td className="instructor-invoice-modal__amount--minus">
                          -{data.withholdingAmount.toLocaleString()}원
                        </td>
                        <td className="instructor-invoice-modal__detail-action-cell">
                          <CmsButton
                            variant="secondary"
                            size="large"
                            onClick={() => window.alert('준비 중입니다.')}
                          >
                            상세 보기
                          </CmsButton>
                        </td>
                      </tr>
                    </>
                  )}
                  <tr className="instructor-invoice-modal__footer-row">
                    <td colSpan={3}>
                      <strong>합계</strong>
                    </td>
                    <td>{data.totalFormulaLabel}</td>
                    <td className="instructor-invoice-modal__total-amount">
                      {(data.totalAmount > 0
                        ? data.totalAmount
                        : data.lineItems.reduce(
                            (s, i) => s + (i.isPositive !== false ? i.정산금액 : 0),
                            0
                          ) - data.withholdingAmount
                      ).toLocaleString()}
                      원
                    </td>
                    <td>
                      <div className="instructor-invoice-modal__footer-actions">
                        <CmsButton
                          variant="primary"
                          size="large"
                          width={160}
                          icon={<DownloadOutlined />}
                          onClick={() => window.alert('준비 중입니다.')}
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
        </PlainHeaderModal>
      ) : null}

      <PaymentOrderPaymentConfirmationModal
        open={paymentConfirmOpen}
        onCancel={() => setPaymentConfirmOpen(false)}
        onConfirm={() => {
          setCurrentPaymentStatementStatus('payment_statement_verified')
          if (trimmedRowId) onPaymentStatementConfirmed?.(trimmedRowId)
          setPaymentConfirmOpen(false)
          setPaymentConfirmDoneOpen(true)
        }}
        data={statementData}
      />
      <PaymentOrderPaymentConfirmationResultModal
        open={paymentConfirmDoneOpen}
        onClose={() => setPaymentConfirmDoneOpen(false)}
      />
      <PaymentOrderPaymentRejectionModal
        open={paymentRejectOpen}
        onCancel={() => setPaymentRejectOpen(false)}
        onReject={reason => {
          setPaymentRejectOpen(false)
          setPaymentRejectReason(reason)
          setPaymentRejectDoneOpen(true)
        }}
        data={statementData}
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
