/**
 * 정산 관리 > 지급 현황 상세(프로그램) — 산출 내역서 모달
 */

import { useEffect, useState } from 'react'
import { message } from 'antd'
import { ContentModal } from '@/shared/ui/content-modal'
import { DetailInfoForm } from '@/shared/ui/detail-info-form'
import { AppButton } from '@/shared/ui/app-button'
import { SendNotiButton } from '@/features/program/ui/detail-modal/components/send-noti-button'
import { withProgramDetailTdDivider } from '@/features/program/ui/program-detail-td-divider'
import type { PaymentOrderProgramCalculationStatement } from '@/data/mock/payment-order-admin-list'
import '@/features/program/ui/detail-modal/applicants/applicant-instructor-basic-info.css'
import '@/features/program/ui/detail-modal/project-info/project-info-form-shared.css'
import '@/pages/settlement-management/payment-order-admin-status-tag.css'
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
}

export function PaymentOrderProgramCalculationStatementModal({
  open,
  onCancel,
  data,
}: PaymentOrderProgramCalculationStatementModalProps) {
  const [paymentConfirmOpen, setPaymentConfirmOpen] = useState(false)
  const [paymentRejectOpen, setPaymentRejectOpen] = useState(false)
  const [paymentRejectDoneOpen, setPaymentRejectDoneOpen] = useState(false)
  const [paymentRejectReason, setPaymentRejectReason] = useState('')

  useEffect(() => {
    if (!open) {
      setPaymentConfirmOpen(false)
      setPaymentRejectOpen(false)
      setPaymentRejectDoneOpen(false)
      setPaymentRejectReason('')
    }
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
            <DetailInfoForm
              title="기본 정보"
              hideHeader
              className="payment-order-calc-statement-modal__detail-form-card"
            >
              <DetailInfoForm.Row type="double">
                <DetailInfoForm.Field
                  label="프로그램명"
                  view={<span>{data.basic.programName}</span>}
                />
                <DetailInfoForm.Field
                  label="사업 운영 기간"
                  view={<span>{data.basic.businessPeriodDisplay}</span>}
                />
              </DetailInfoForm.Row>
              <DetailInfoForm.Row type="double">
                <DetailInfoForm.Field
                  label="프로그램 진행 회차"
                  view={<span>{data.basic.programSessionProgressDisplay}</span>}
                />
                <DetailInfoForm.Field
                  label="지급 조서 처리 현황"
                  view={
                    data.basic.processingStatusClass === 'rejected' ? (
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
                    )
                  }
                />
              </DetailInfoForm.Row>
              <DetailInfoForm.Row type="double">
                <DetailInfoForm.Field
                  label="강의비 책정 기준"
                  view={
                    <div className="payment-order-calc-statement-modal__td-divider-wrap payment-order-calc-statement-modal__td-divider-wrap--start">
                      {withProgramDetailTdDivider([
                        data.basic.lectureFeeStandardTitle,
                        data.basic.lectureFeeStandardAmount,
                      ])}
                    </div>
                  }
                />
                <DetailInfoForm.Field
                  label="사업소득자 여부"
                  view={<span>{data.basic.businessIncomeEarnerLabel}</span>}
                />
              </DetailInfoForm.Row>
            </DetailInfoForm>
          </div>
        ) : (
          <div
            className="payment-order-calc-statement-modal__basic payment-order-calc-statement-modal__basic--instructor"
            style={{ minWidth: CALC_STATEMENT_CONTENT_MIN_WIDTH }}
          >
            <DetailInfoForm
              title="기본 정보"
              className="payment-order-calc-statement-modal__detail-form-card"
            >
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.NameBlock
                  rows={[
                    {
                      subLabel: '한글',
                      main: <span>{data.basic.nameKo}</span>,
                      sideLabel: '연락처',
                      side: <span>{data.basic.phoneDisplay}</span>,
                    },
                    {
                      subLabel: '영문',
                      main: <span>{data.basic.nameEn}</span>,
                      sideLabel: '이메일',
                      side: <span>{data.basic.emailDisplay}</span>,
                    },
                  ]}
                />
              </DetailInfoForm.Row>
              <DetailInfoForm.Row type="double">
                <DetailInfoForm.Field
                  label="자택 주소"
                  view={
                    data.basic.addressBlurredTail ? (
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
                      <span>{data.basic.addressDisplay}</span>
                    )
                  }
                />
                <DetailInfoForm.Field
                  label="정산 계좌 정보"
                  view={
                    <div className="payment-order-calc-statement-modal__td-divider-wrap payment-order-calc-statement-modal__td-divider-wrap--start">
                      {withProgramDetailTdDivider([
                        data.basic.settlementAccountBankNumberPart,
                        data.basic.settlementAccountHolderPart,
                      ])}
                    </div>
                  }
                />
              </DetailInfoForm.Row>
            </DetailInfoForm>

            <div className="payment-order-calc-statement-modal__basic-group-gap" aria-hidden />

            <DetailInfoForm
              title="기본 정보 — 지급 조서·강의비·사업소득"
              hideHeader
              className="payment-order-calc-statement-modal__detail-form-card"
            >
              <DetailInfoForm.Row type="double">
                <DetailInfoForm.Field
                  label="지급 조서 처리 현황"
                  fullRow
                  view={
                    data.basic.processingStatusClass === 'rejected' ? (
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
                    )
                  }
                />
              </DetailInfoForm.Row>
              <DetailInfoForm.Row type="double">
                <DetailInfoForm.Field
                  label="강의비 책정 기준"
                  view={
                    <div className="payment-order-calc-statement-modal__td-divider-wrap payment-order-calc-statement-modal__td-divider-wrap--start">
                      {withProgramDetailTdDivider([
                        data.basic.lectureFeeStandardTitle,
                        data.basic.lectureFeeStandardAmount,
                      ])}
                    </div>
                  }
                />
                <DetailInfoForm.Field
                  label="사업소득자 여부"
                  view={<span>{data.basic.businessIncomeEarnerLabel}</span>}
                />
              </DetailInfoForm.Row>
            </DetailInfoForm>
          </div>
        )}

        <PaymentOrderCalculationBreakdownTable
          blocks={data.blocks}
          formulaLabel={data.formulaLabel}
          totalAmount={data.totalAmount}
          processingStatus={data.basic.processingStatusClass}
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
          window.alert('준비 중입니다.')
          setPaymentConfirmOpen(false)
          message.info('지급조서 확인 완료 처리는 추후 연결됩니다.')
        }}
        data={data}
      />
      <PaymentOrderPaymentRejectionModal
        open={paymentRejectOpen}
        onCancel={() => setPaymentRejectOpen(false)}
        onReject={reason => {
          setPaymentRejectOpen(false)
          setPaymentRejectReason(reason)
          setPaymentRejectDoneOpen(true)
        }}
        data={data}
      />
      <PaymentOrderPaymentRejectionResultModal
        open={paymentRejectDoneOpen}
        onClose={() => setPaymentRejectDoneOpen(false)}
        data={data}
        reason={paymentRejectReason}
      />
    </>
  )
}
