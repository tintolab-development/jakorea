/**
 * 산출 내역서 — 기본 정보(프로그램명·회차·사업기간·지급조서·강의비·사업소득) 공통 블록
 */

import type { CSSProperties } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { SendNotiButton } from '@/features/program/ui/detail-modal/components/send-noti-button'
import {
  ProgramDetailTdDivider,
  withProgramDetailTdDivider,
} from '@/features/program/ui/program-detail-td-divider'
import type {
  PaymentOrderAdminLineProcessingStatus,
  PaymentOrderCalculationStatementProgramBasicInfo,
} from '@/data/mock/payment-order-admin-list'

export interface PaymentOrderCalculationStatementProgramBasicSectionProps {
  basic: PaymentOrderCalculationStatementProgramBasicInfo
  style?: CSSProperties
}

function processingStatusCssModifier(status: PaymentOrderAdminLineProcessingStatus): string {
  return status === 'application_rejected' ? 'application-rejected' : status
}

function sendNotiPlaceholder() {
  window.alert('준비중')
}

function ProcessingStatusView({
  basic,
}: {
  basic: PaymentOrderCalculationStatementProgramBasicInfo
}) {
  const statusMod = processingStatusCssModifier(basic.processingStatusClass)

  if (basic.processingStatusClass === 'application_rejected' || basic.processingStatusClass === 'rejected') {
    const isApplicationRejected = basic.processingStatusClass === 'application_rejected'
    return (
      <div className="payment-order-calc-statement-modal__processing-status-row payment-order-calc-statement-modal__processing-status-row--pd-divider">
        {isApplicationRejected ? (
          <span className="payment-order-calc-statement-modal__processing-status-label--application-rejected">
            신청 반려
          </span>
        ) : (
          <span className="payment-order-admin__status-text payment-order-admin__status-text--rejected">
            {basic.processingStatusDisplay}
          </span>
        )}
        <ProgramDetailTdDivider />
        <span className="payment-order-calc-statement-modal__processing-status-detail">
          사유 : {basic.processingRejectionReason ?? '-'}
        </span>
        <ProgramDetailTdDivider />
        <SendNotiButton onClick={sendNotiPlaceholder} />
      </div>
    )
  }

  if (basic.processingStatusClass === 'confirmed') {
    return (
      <div className="payment-order-calc-statement-modal__processing-status-row payment-order-calc-statement-modal__processing-status-row--pd-divider">
        <span className="payment-order-admin__status-text payment-order-admin__status-text--confirmed">
          {basic.processingStatusDisplay}
        </span>
        <ProgramDetailTdDivider />
        <span className="payment-order-calc-statement-modal__processing-status-detail">
          이체 예정일 : {basic.lectureFeePaymentScheduledDateDisplay ?? '-'}
        </span>
      </div>
    )
  }

  return (
    <span
      className={`payment-order-admin__status-text payment-order-admin__status-text--${statusMod}`}
    >
      {basic.processingStatusDisplay}
    </span>
  )
}

export function PaymentOrderCalculationStatementProgramBasicSection({
  basic,
  style,
}: PaymentOrderCalculationStatementProgramBasicSectionProps) {
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

      <DetailInfoForm title="기본 정보 — 지급 조서" hideHeader className={formCardClass}>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="지급 조서 처리 현황"
            fullRow
            view={<ProcessingStatusView basic={basic} />}
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="강의비 책정 기준"
            view={
              <div className="payment-order-calc-statement-modal__td-divider-wrap payment-order-calc-statement-modal__td-divider-wrap--start">
                {withProgramDetailTdDivider([basic.lectureFeeStandardTitle, basic.lectureFeeStandardAmount])}
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
