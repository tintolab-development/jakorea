/**
 * 정산 관리 > 지급 현황 상세(프로그램) — 산출 내역서 ContentModal
 */

import { useEffect, useState } from 'react'
import { message } from 'antd'
import { ContentModal } from '@/shared/ui/content-modal'
import { AppButton } from '@/shared/ui/app-button'
import { SendNotiButton } from '@/features/program/ui/detail-modal/components/send-noti-button'
import { withProgramDetailTdDivider } from '@/features/program/ui/program-detail-td-divider'
import type { PaymentOrderProgramCalculationStatement } from '@/data/mock/payment-order-admin-list'
import type { PaymentOrderCalculationStatementCommitPayload } from './payment-order-detail-fullpage-shared'
import '@/features/program/ui/detail-modal/applicants/applicant-instructor-basic-info.css'
import '@/features/program/ui/detail-modal/project-info/project-info-form-shared.css'
import './payment-order-admin-status-tag.css'
import './payment-order-program-calculation-statement-modal.css'
import { PaymentOrderPaymentConfirmationModal } from './payment-order-payment-confirmation-modal'
import { PaymentOrderPaymentRejectionModal } from './payment-order-payment-rejection-modal'
import { PaymentOrderPaymentRejectionResultModal } from './payment-order-payment-rejection-result-modal'
import {
  PAYMENT_ORDER_CALC_BREAKDOWN_MIN_WIDTH,
  PaymentOrderCalculationBreakdownTable,
} from './payment-order-calculation-breakdown-table'

/** 기본정보 블록 가로 폭을 하단 테이블과 맞춤 */
const CALC_STATEMENT_CONTENT_MIN_WIDTH = PAYMENT_ORDER_CALC_BREAKDOWN_MIN_WIDTH

export interface PaymentOrderProgramCalculationStatementModalProps {
  open: boolean
  onCancel: () => void
  data: PaymentOrderProgramCalculationStatement | null
  /** 확인 처리·신청 반려 확정 시 목록 행 동기화 후 `onCancel`으로 산출 내역서 닫기 */
  onProcessingCommitted?: (payload: PaymentOrderCalculationStatementCommitPayload) => void
  /** 신청 반려 직후 산출 내역서 본문만 닫기(`data`는 결과 모달 종료 시 `onClearCalculationStatementData`까지 유지) */
  onCloseStatementSheet?: () => void
  /** 반려 결과 모달「확인」 후 mock 데이터 제거 */
  onClearCalculationStatementData?: () => void
}

export function PaymentOrderProgramCalculationStatementModal({
  open,
  onCancel,
  data,
  onProcessingCommitted,
  onCloseStatementSheet,
  onClearCalculationStatementData,
}: PaymentOrderProgramCalculationStatementModalProps) {
  const [paymentConfirmOpen, setPaymentConfirmOpen] = useState(false)
  const [paymentRejectOpen, setPaymentRejectOpen] = useState(false)
  const [paymentRejectDoneOpen, setPaymentRejectDoneOpen] = useState(false)
  const [paymentRejectReason, setPaymentRejectReason] = useState('')

  useEffect(() => {
    if (open) {
      setPaymentConfirmOpen(false)
      setPaymentRejectOpen(false)
      setPaymentRejectDoneOpen(false)
      setPaymentRejectReason('')
      return
    }
    setPaymentConfirmOpen(false)
    setPaymentRejectOpen(false)
  }, [open])

  if (!data) {
    return null
  }

  return (
    <>
    <ContentModal
      open={open}
      onCancel={onCancel}
      title="산출 내역서"
      size="large"
      width={1400}
      className="payment-order-calc-statement-modal"
      footer={
        <AppButton variant="cancel" size="large" onClick={onCancel}>
          닫기
        </AppButton>
      }
    >
      {data.context === 'program' ? (
        <div
          className="payment-order-calc-statement-modal__basic payment-order-calc-statement-modal__basic--program-info"
          style={{ minWidth: CALC_STATEMENT_CONTENT_MIN_WIDTH }}
        >
          <h3 className="program-detail-info-tab__section-title payment-order-calc-statement-modal__basic-info-title">
            기본 정보
          </h3>
          <div className="program-detail-info-tab__table-wrapper program-detail-info-tab__table-wrapper--top">
            <table className="program-detail-info-tab__table program-detail-info-tab__table--basic">
              <colgroup>
                <col style={{ width: '200px' }} />
                <col />
                <col style={{ width: '200px' }} />
                <col />
              </colgroup>
              <tbody>
                <tr>
                  <th scope="row">프로그램명</th>
                  <td>{data.basic.programName}</td>
                  <th scope="row">사업 운영 기간</th>
                  <td>{data.basic.businessPeriodDisplay}</td>
                </tr>
                <tr>
                  <th scope="row">프로그램 진행 회차</th>
                  <td>{data.basic.programSessionProgressDisplay}</td>
                  <th scope="row">지급 조서 처리 현황</th>
                  <td>
                    {data.basic.processingStatusClass === 'rejected' ? (
                      <div className="payment-order-calc-statement-modal__processing-status-row">
                        <span
                          className={`payment-order-admin__status-text payment-order-admin__status-text--${data.basic.processingStatusClass}`}
                        >
                          {data.basic.processingStatusDisplay}
                        </span>
                        <span
                          className="payment-order-calc-statement-modal__processing-vbar"
                          aria-hidden="true"
                        />
                        <span className="payment-order-calc-statement-modal__processing-reason">
                          사유 : {data.basic.processingRejectionReason ?? '-'}
                        </span>
                        <span
                          className="payment-order-calc-statement-modal__processing-vbar"
                          aria-hidden="true"
                        />
                        <SendNotiButton />
                      </div>
                    ) : (
                      <span
                        className={`payment-order-admin__status-text payment-order-admin__status-text--${data.basic.processingStatusClass}`}
                      >
                        {data.basic.processingStatusDisplay}
                      </span>
                    )}
                  </td>
                </tr>
                <tr>
                  <th scope="row">강의비 책정 기준</th>
                  <td>
                    <div className="payment-order-calc-statement-modal__td-divider-wrap payment-order-calc-statement-modal__td-divider-wrap--start">
                      {withProgramDetailTdDivider([
                        data.basic.lectureFeeStandardTitle,
                        data.basic.lectureFeeStandardAmount,
                      ])}
                    </div>
                  </td>
                  <th scope="row">사업소득자 여부</th>
                  <td>{data.basic.businessIncomeEarnerLabel}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div
          className="payment-order-calc-statement-modal__basic payment-order-calc-statement-modal__basic--instructor"
          style={{ minWidth: CALC_STATEMENT_CONTENT_MIN_WIDTH }}
        >
          <h3 className="payment-order-calc-statement-modal__section-title">기본 정보</h3>
          <div className="applicant-instructor-basic-info__table-wrap payment-order-calc-statement-modal__basic-applicant-wrap">
            <table className="applicant-instructor-basic-info__table">
              <colgroup>
                <col style={{ width: '140px' }} />
                <col style={{ width: '80px' }} />
                <col />
                <col style={{ width: '160px' }} />
                <col />
              </colgroup>
              <tbody>
                <tr>
                  <td
                    rowSpan={2}
                    className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label applicant-instructor-basic-info__cell--name"
                  >
                    성명
                  </td>
                  <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label">
                    한글
                  </td>
                  <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                    {data.basic.nameKo}
                  </td>
                  <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label">
                    연락처
                  </td>
                  <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                    {data.basic.phoneDisplay}
                  </td>
                </tr>
                <tr>
                  <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label">
                    영문
                  </td>
                  <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                    {data.basic.nameEn}
                  </td>
                  <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label">
                    이메일
                  </td>
                  <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                    {data.basic.emailDisplay}
                  </td>
                </tr>
                <tr>
                  <td
                    colSpan={2}
                    className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label"
                  >
                    자택 주소
                  </td>
                  <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                    {data.basic.addressBlurredTail ? (
                      <>
                        {data.basic.addressDisplay}
                        <span
                          className="applicant-instructor-basic-info__address-blur"
                          aria-hidden="true"
                        >
                          {' '}
                          {data.basic.addressBlurredTail}
                        </span>
                      </>
                    ) : (
                      data.basic.addressDisplay
                    )}
                  </td>
                  <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label">
                    정산 계좌 정보
                  </td>
                  <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                    <div className="payment-order-calc-statement-modal__td-divider-wrap payment-order-calc-statement-modal__td-divider-wrap--start">
                      {withProgramDetailTdDivider([
                        data.basic.settlementAccountBankNumberPart,
                        data.basic.settlementAccountHolderPart,
                      ])}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="payment-order-calc-statement-modal__basic-group-gap" aria-hidden />

          <div className="applicant-instructor-basic-info__table-wrap payment-order-calc-statement-modal__basic-applicant-wrap">
            <table className="applicant-instructor-basic-info__table">
              <colgroup>
                <col style={{ width: '140px' }} />
                <col style={{ width: '80px' }} />
                <col />
                <col style={{ width: '160px' }} />
                <col />
              </colgroup>
              <tbody>
                <tr>
                  <td
                    colSpan={2}
                    className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label"
                  >
                    지급 조서 처리 현황
                  </td>
                  <td
                    colSpan={3}
                    className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value"
                  >
                    {data.basic.processingStatusClass === 'rejected' ? (
                      <div className="payment-order-calc-statement-modal__processing-status-row">
                        <span
                          className={`payment-order-admin__status-text payment-order-admin__status-text--${data.basic.processingStatusClass}`}
                        >
                          {data.basic.processingStatusDisplay}
                        </span>
                        <span
                          className="payment-order-calc-statement-modal__processing-vbar"
                          aria-hidden="true"
                        />
                        <span className="payment-order-calc-statement-modal__processing-reason">
                          사유 : {data.basic.processingRejectionReason ?? '-'}
                        </span>
                        <span
                          className="payment-order-calc-statement-modal__processing-vbar"
                          aria-hidden="true"
                        />
                        <SendNotiButton />
                      </div>
                    ) : (
                      <span
                        className={`payment-order-admin__status-text payment-order-admin__status-text--${data.basic.processingStatusClass}`}
                      >
                        {data.basic.processingStatusDisplay}
                      </span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td
                    colSpan={2}
                    className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label"
                  >
                    강의비 책정 기준
                  </td>
                  <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                    <div className="payment-order-calc-statement-modal__td-divider-wrap payment-order-calc-statement-modal__td-divider-wrap--start">
                      {withProgramDetailTdDivider([
                        data.basic.lectureFeeStandardTitle,
                        data.basic.lectureFeeStandardAmount,
                      ])}
                    </div>
                  </td>
                  <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label">
                    사업소득자 여부
                  </td>
                  <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                    {data.basic.businessIncomeEarnerLabel}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      <PaymentOrderCalculationBreakdownTable
        blocks={data.blocks}
        formulaLabel={data.formulaLabel}
        totalAmount={data.totalAmount}
        headerActions={
          <>
            <AppButton variant="danger" size="filter" onClick={() => setPaymentRejectOpen(true)}>
              신청 반려
            </AppButton>
            <AppButton
              variant="primary"
              size="filter"
              modalTeal
              onClick={() => setPaymentConfirmOpen(true)}
            >
              확인 처리
            </AppButton>
          </>
        }
      />
    </ContentModal>
    <PaymentOrderPaymentConfirmationModal
      open={paymentConfirmOpen}
      onCancel={() => setPaymentConfirmOpen(false)}
      onConfirm={() => {
        setPaymentConfirmOpen(false)
        onProcessingCommitted?.({
          lineId: data.sourceLineRowId,
          status: 'confirmed',
        })
        message.success('지급조서 확인 완료 처리되었습니다.')
        onCancel()
      }}
      data={data}
    />
    <PaymentOrderPaymentRejectionModal
      open={paymentRejectOpen}
      onCancel={() => setPaymentRejectOpen(false)}
      onReject={reason => {
        setPaymentRejectOpen(false)
        onProcessingCommitted?.({
          lineId: data.sourceLineRowId,
          status: 'rejected',
          rejectionReason: reason,
        })
        setPaymentRejectReason(reason)
        setPaymentRejectDoneOpen(true)
        onCloseStatementSheet?.()
      }}
      data={data}
    />
    <PaymentOrderPaymentRejectionResultModal
      open={paymentRejectDoneOpen}
      onClose={() => {
        setPaymentRejectDoneOpen(false)
        setPaymentRejectReason('')
        onClearCalculationStatementData?.()
      }}
      data={data}
      reason={paymentRejectReason}
    />
    </>
  )
}
