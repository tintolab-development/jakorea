/**
 * 산출 내역서 — 기본 정보(신청자·강사 맥락 applicant 테이블 + 지급조서 블록)
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

export interface PaymentOrderCalculationStatementInstructorBasicSectionProps {
  basic: PaymentOrderCalculationStatementInstructorBasicInfo
  style?: CSSProperties
}

function NameKoreanCell({ basic }: { basic: PaymentOrderCalculationStatementInstructorBasicInfo }) {
  const count = basic.scheduleChangeCancelCount
  if (count != null && count > 0) {
    return (
      <>
        {basic.nameKo}
        <ScheduleChangeHistoryBadge
          count={count}
          className="applicant-instructor-basic-info__name-badge"
        />
      </>
    )
  }
  return <>{basic.nameKo}</>
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

      <section className="applicant-instructor-basic-info">
        <div className="applicant-instructor-basic-info__table-wrap">
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
                  <NameKoreanCell basic={basic} />
                </td>
                <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label">
                  성별 및 생년월일
                </td>
                <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                  <ProgramDetailTdSegmentWrap>
                    {basic.genderBirthDisplay?.trim() || '-'}
                  </ProgramDetailTdSegmentWrap>
                </td>
              </tr>
              <tr>
                <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label">
                  영문
                </td>
                <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                  {basic.nameEn || '-'}
                </td>
                <td
                  colSpan={2}
                  className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value"
                  aria-hidden
                />
              </tr>
              <tr>
                <td
                  colSpan={2}
                  className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label"
                >
                  연락처
                </td>
                <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                  {basic.phoneDisplay || '-'}
                </td>
                <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label">
                  이메일
                </td>
                <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                  {basic.emailDisplay || '-'}
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
                  <AddressDisplay basic={basic} />
                </td>
                <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label">
                  정산 계좌 정보
                </td>
                <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                  <div className="payment-order-calc-statement-modal__td-divider-wrap payment-order-calc-statement-modal__td-divider-wrap--start">
                    {settlementAccountDisplay}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div className="payment-order-calc-statement-modal__basic-group-gap" aria-hidden />

      <DetailInfoForm title="기본 정보 — 지급 조서" hideHeader className={formCardClass}>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="지급 조서 처리 현황"
            fullRow
            view={<PaymentOrderCalculationStatementProcessingStatusView basic={basic} />}
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
