/**
 * 산출 내역서 — 기본 정보(프로그램명·회차·사업기간·지급조서·강사비·사업소득) 공통 블록
 */

import type { CSSProperties } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { withProgramDetailTdDivider } from '@/features/program/shared/ui/program-detail-td-divider'
import type { PaymentOrderCalculationStatementProgramBasicInfo } from '@/features/settlement-management/model/payment-order-admin-list'
import {
  isPaymentOrderTransferScheduledStatus,
  PaymentOrderCalculationStatementProcessingStatusView,
  isPaymentOrderCorrectionRequestedStatus,
} from './payment-order-calculation-statement-processing-status-view'

export interface PaymentOrderCalculationStatementProgramBasicSectionProps {
  basic: PaymentOrderCalculationStatementProgramBasicInfo
  style?: CSSProperties
  onResendNotificationClick?: () => void
}

export function PaymentOrderCalculationStatementProgramBasicSection({
  basic,
  style,
  onResendNotificationClick,
}: PaymentOrderCalculationStatementProgramBasicSectionProps) {
  const showTransferScheduledDate = isPaymentOrderTransferScheduledStatus(
    basic.processingStatusClass
  )
  const showCorrectionReason = isPaymentOrderCorrectionRequestedStatus(basic.processingStatusClass)
  const formCardClass =
    'payment-order-calc-statement-modal__detail-form-card payment-order-calc-statement-modal__detail-form-card--program'

  return (
    <div
      className="payment-order-calc-statement-modal__basic payment-order-calc-statement-modal__basic--program-info"
      style={style}
    >
      <h2 className="payment-order-calc-statement-modal__basic-heading">기본 정보</h2>

      <DetailInfoForm title="기본 정보 — 프로그램" hideHeader className={formCardClass}>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="프로그램명"
            fullRow
            view={<span>{basic.programName}</span>}
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="프로그램 진행 회차"
            view={<span>{basic.programSessionProgressDisplay}</span>}
          />
          <DetailInfoForm.Field
            label="사업 운영 기간"
            view={<span>{basic.businessPeriodDisplay}</span>}
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>

      <div className="payment-order-calc-statement-modal__basic-split-gap" aria-hidden />

      <DetailInfoForm title="기본 정보 — 지급조서" hideHeader className={formCardClass}>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="지급조서 처리 현황"
            fullRow={!showTransferScheduledDate && !showCorrectionReason}
            view={
              <PaymentOrderCalculationStatementProcessingStatusView
                basic={basic}
                onResendNotificationClick={onResendNotificationClick}
                separateTransferScheduledDate
              />
            }
          />
          {showTransferScheduledDate ? (
            <DetailInfoForm.Field
              label="이체 예정일"
              view={<span>{basic.lectureFeePaymentScheduledDateDisplay ?? '-'}</span>}
            />
          ) : null}
          {showCorrectionReason ? (
            <DetailInfoForm.Field
              label="정정 요청 사유"
              view={<span>{basic.correctionReason?.trim() || '-'}</span>}
            />
          ) : null}
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="강사비 책정 기준"
            view={
              <div className="payment-order-calc-statement-modal__td-divider-wrap payment-order-calc-statement-modal__td-divider-wrap--start">
                {withProgramDetailTdDivider([
                  basic.lectureFeeStandardTitle,
                  basic.lectureFeeStandardAmount,
                ])}
              </div>
            }
          />
          <DetailInfoForm.Field
            label="사업소득자 여부"
            view={<span>{basic.businessIncomeEarnerLabel}</span>}
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </div>
  )
}
