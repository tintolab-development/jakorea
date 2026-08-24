/**
 * 산출 내역서 — 신청자형 기본 정보
 * 성명·성별/생년·연락처·주소지·계좌 + 지급조서 처리 현황·강의비·사업소득 (단일 그리드)
 */

import type { CSSProperties } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { ScheduleChangeHistoryBadge } from '@/shared/components/schedule-change-history-badge'
import {
  ProgramDetailTdSegmentWrap,
  withProgramDetailTdDivider,
} from '@/features/program/shared/ui/program-detail-td-divider'
import type { PaymentOrderCalculationStatementInstructorBasicInfo } from '@/data/mock/payment-order-admin-list'
import { PaymentOrderCalculationStatementProcessingStatusView } from './payment-order-calculation-statement-processing-status-view'
import '@/features/program/shared/ui/program-detail/applicant-list/applicant-instructor-basic-info.css'

export interface PaymentOrderCalculationStatementInstructorBasicSectionProps {
  basic: PaymentOrderCalculationStatementInstructorBasicInfo
  style?: CSSProperties
}

function NameCell({ basic }: { basic: PaymentOrderCalculationStatementInstructorBasicInfo }) {
  const count = basic.scheduleChangeCancelCount
  return (
    <span className="payment-order-calc-statement-modal__name-cell">
      {basic.nameKo}
      {count != null && count > 0 ? (
        <ScheduleChangeHistoryBadge count={count} />
      ) : null}
    </span>
  )
}

function AddressDisplay({ basic }: { basic: PaymentOrderCalculationStatementInstructorBasicInfo }) {
  if (!basic.addressDisplay) return <>-</>
  if (!basic.addressBlurredTail?.trim()) {
    return <span>{basic.addressDisplay}</span>
  }
  return (
    <>
      {basic.addressDisplay}
      <span className="applicant-instructor-basic-info__address-blur" aria-hidden="true">
        {basic.addressBlurredTail}
      </span>
    </>
  )
}

export function PaymentOrderCalculationStatementInstructorBasicSection({
  basic,
  style,
}: PaymentOrderCalculationStatementInstructorBasicSectionProps) {
  const formCardClass =
    'payment-order-calc-statement-modal__detail-form-card payment-order-calc-statement-modal__detail-form-card--program'

  const settlementAccountDisplay = withProgramDetailTdDivider([
    basic.settlementAccountBankNumberPart,
    basic.settlementAccountHolderPart,
  ])

  return (
    <div
      className="payment-order-calc-statement-modal__basic payment-order-calc-statement-modal__basic--instructor"
      style={style}
    >
      <h2 className="payment-order-calc-statement-modal__basic-heading">기본 정보</h2>

      <DetailInfoForm title="기본 정보 — 신청자" hideHeader className={formCardClass}>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field label="성명" view={<NameCell basic={basic} />} />
          <DetailInfoForm.Field
            label="성별 및 생년월일"
            view={
              <ProgramDetailTdSegmentWrap>
                {basic.genderBirthDisplay?.trim() || '-'}
              </ProgramDetailTdSegmentWrap>
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field label="연락처" view={<span>{basic.phoneDisplay || '-'}</span>} />
          <DetailInfoForm.Field label="이메일" view={<span>{basic.emailDisplay || '-'}</span>} />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field label="자택 주소지" view={<AddressDisplay basic={basic} />} />
          <DetailInfoForm.Field
            label="정산 계좌 정보"
            view={
              <div className="payment-order-calc-statement-modal__td-divider-wrap payment-order-calc-statement-modal__td-divider-wrap--start">
                {settlementAccountDisplay}
              </div>
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="지급조서 처리 현황"
            fullRow
            view={<PaymentOrderCalculationStatementProcessingStatusView basic={basic} />}
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="강의비 책정 기준"
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
