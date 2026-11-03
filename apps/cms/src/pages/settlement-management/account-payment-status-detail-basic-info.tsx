/**
 * 계좌 지급 현황 상세 — 기본 정보(인적 1블록 + 프로그램·지급 1블록)
 */

import type { AccountPaymentStatusDetailBasic } from '@/features/settlement-management/model/account-payments-list'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { ScheduleChangeHistoryBadge } from '@/shared/components/schedule-change-history-badge'
import {
  renderDetailInfoPipeSeparated,
  withProgramDetailTdDivider,
} from '@/features/program/shared/ui/program-detail-td-divider'
import '@/features/program/shared/ui/program-detail/applicant-list/applicant-instructor-basic-info.css'
import '@/features/settlement/ui/payment-record/payment-order-program-calculation-statement-modal.css'
import './account-payments-page.css'
import './payment-order-instructor-status-detail-fullpage-modal.css'

function getAccountPaymentStatusClassName(
  status: AccountPaymentStatusDetailBasic['accountPaymentStatus']
): string {
  switch (status) {
    case 'awaiting_confirmation':
      return 'account-payments-page__status-text--awaiting-confirmation'
    case 'partial_confirmation':
      return 'account-payments-page__status-text--partial-confirmation'
    case 'account_paid':
      return 'account-payments-page__status-text--account-paid'
    case 'payment_correction_requested':
      return 'account-payments-page__status-text--payment-correction-requested'
    default:
      return ''
  }
}

function NameCell({
  nameKo,
  scheduleChangeCancelCount,
}: {
  nameKo: string
  scheduleChangeCancelCount?: number
}) {
  const count = scheduleChangeCancelCount
  return (
    <span className="payment-order-instructor-status-detail__name-cell">
      {nameKo}
      {count != null && count > 0 ? <ScheduleChangeHistoryBadge count={count} /> : null}
    </span>
  )
}

export interface AccountPaymentStatusDetailBasicInfoProps {
  basic: AccountPaymentStatusDetailBasic
}

export function AccountPaymentStatusDetailBasicInfo({ basic }: AccountPaymentStatusDetailBasicInfoProps) {
  const settlementAccountDisplay = [basic.settlementAccountBankNumberPart, basic.settlementAccountHolderPart]
    .filter(part => part?.trim() && part.trim() !== '-')
    .join(' | ')

  return (
    <div
      className="account-payment-status-detail-fullpage-modal__basic-stack payment-order-instructor-status-detail__basic-block program-detail-fullpage-modal__info-tab-block"
    >
      <DetailInfoForm
        title="기본 정보"
        className="account-payment-status-detail-fullpage-modal__detail-form-card"
      >
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="성명"
            view={
              <NameCell
                nameKo={basic.nameKo}
                scheduleChangeCancelCount={basic.scheduleChangeCancelCount}
              />
            }
          />
          <DetailInfoForm.Field
            label="성별 및 생년월일"
            view={renderDetailInfoPipeSeparated(basic.genderBirthDisplay)}
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field label="연락처" view={<span>{basic.phoneDisplay || '-'}</span>} />
          <DetailInfoForm.Field label="이메일" view={<span>{basic.emailDisplay || '-'}</span>} />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="자택 주소지"
            view={
              basic.addressBlurredTail ? (
                <>
                  {basic.addressDisplay}
                  <span
                    className="applicant-instructor-basic-info__address-blur"
                    aria-hidden="true"
                  >
                    {' '}
                    {basic.addressBlurredTail}
                  </span>
                </>
              ) : (
                <span>{basic.addressDisplay || '-'}</span>
              )
            }
          />
          <DetailInfoForm.Field
            label="정산 계좌 정보"
            view={renderDetailInfoPipeSeparated(settlementAccountDisplay || '-')}
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>

      <DetailInfoForm
        title="프로그램·지급 정보"
        hideHeader
        className="account-payment-status-detail-fullpage-modal__detail-form-card"
      >
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field label="프로그램명" view={<span>{basic.programName}</span>} />
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
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="계좌 지급 현황"
            view={
              <span className={getAccountPaymentStatusClassName(basic.accountPaymentStatus)}>
                {basic.accountPaymentStatusLabel}
              </span>
            }
          />
          <DetailInfoForm.Field
            label="이체 예정일"
            view={<span>{basic.transferScheduledDateDisplay || '-'}</span>}
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
