/**
 * 지급 현황 상세 — 신청자별 기본 정보 블록
 * 성명(+일정변경 배지)·성별/생년·연락처·이메일·주소지·계좌·지급조서 현황·총 정산 신청 금액
 */

import { MASKING_POLICY } from '@/shared/constants/download-policy'
import type { PaymentOrderAdminInstructorDetail } from '@/features/settlement-management/model/payment-order-admin-list'
import type { PaymentOrderDetailAggregateStatus } from '@/shared/constants/payment-order-aggregate-status'
import { PersonalInfoRevealButton } from '@/features/user/detail/ui/personal-info-reveal-button'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { ScheduleChangeHistoryBadge } from '@/shared/components/schedule-change-history-badge'
import { renderDetailInfoPipeSeparated } from '@/features/program/shared/ui/program-detail-td-divider'
import { formatWon } from './payment-order-detail-fullpage-shared'
import { renderAggregateStatus } from './payment-order-detail-aggregate-status'
import '@/features/program/shared/ui/program-detail/applicant-list/applicant-instructor-basic-info.css'

export interface PaymentOrderInstructorBasicInfoProps {
  detail: PaymentOrderAdminInstructorDetail
  aggregateStatus: PaymentOrderDetailAggregateStatus
  /** 라인 합산 오버라이드(반려·정정 제외). 없으면 detail.totalEstimatedAmount */
  totalEstimatedAmount?: number
  personalInfoRevealed: boolean
  onPersonalInfoButtonClick: () => void
}

/**
 * 자택 주소 마스킹 표시. 원문이 와도 공통 규칙(`MASKING_POLICY.address`)으로 먼저 가려
 * 블러 구간에 원문 글자가 DOM으로 남지 않게 한다. 보이는 구간 뒤 `*` 구간만 블러 처리한다.
 */
function AddressBlurDisplay({ address }: { address: string }) {
  const trimmed = address?.trim()
  if (!trimmed) return <>-</>
  const masked = MASKING_POLICY.address(trimmed)
  const tailStart = masked.indexOf(' *')
  if (tailStart < 0) return <>{masked}</>
  return (
    <>
      {masked.slice(0, tailStart)}
      <span className="applicant-instructor-basic-info__address-blur" aria-hidden="true">
        {masked.slice(tailStart)}
      </span>
    </>
  )
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

export function PaymentOrderInstructorBasicInfo({
  detail,
  aggregateStatus,
  totalEstimatedAmount,
  personalInfoRevealed,
  onPersonalInfoButtonClick,
}: PaymentOrderInstructorBasicInfoProps) {
  const displayTotalAmount = totalEstimatedAmount ?? detail.totalEstimatedAmount
  const maskedPhone = MASKING_POLICY.phone(detail.phone)
  const maskedEmail = MASKING_POLICY.email(detail.email)
  const maskedAccountLeft = [detail.bankName, MASKING_POLICY.accountNumber(detail.accountNumber)]
    .filter(Boolean)
    .join(' ')
  const maskedHolder = MASKING_POLICY.accountHolderName(detail.accountHolder)
  const maskedAccountDisplay =
    maskedAccountLeft && maskedHolder
      ? `${maskedAccountLeft} | ${maskedHolder}`
      : maskedAccountLeft || maskedHolder || '-'

  const phoneDisplay = personalInfoRevealed ? detail.phone : maskedPhone
  const emailDisplay = personalInfoRevealed ? detail.email : maskedEmail
  const plainAccountLeft = [detail.bankName, detail.accountNumber].filter(Boolean).join(' ')
  const plainHolder = detail.accountHolder ?? ''
  const accountDisplay = personalInfoRevealed
    ? plainAccountLeft && plainHolder
      ? `${plainAccountLeft} | ${plainHolder}`
      : plainAccountLeft || plainHolder || '-'
    : maskedAccountDisplay
  const addressDisplay = personalInfoRevealed ? (
    <>{detail.address || '-'}</>
  ) : (
    <AddressBlurDisplay address={detail.address} />
  )

  return (
    <div className="payment-order-program-status-detail__basic-block program-detail-fullpage-modal__info-tab-block payment-order-instructor-status-detail__basic-block">
      <DetailInfoForm
        title="기본 정보"
        className="payment-order-instructor-status-detail__detail-form"
        titleTrailing={
          <PersonalInfoRevealButton
            labelMode="toggle"
            revealed={personalInfoRevealed}
            onClick={onPersonalInfoButtonClick}
            // 시안(15524:543381) 기본 정보 제목줄 버튼 = Button / h40
            cmsSize="medium"
          />
        }
      >
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="성명"
            view={
              <NameCell
                nameKo={detail.nameKo}
                scheduleChangeCancelCount={detail.scheduleChangeCancelCount}
              />
            }
          />
          <DetailInfoForm.Field
            label="성별 및 생년월일"
            view={renderDetailInfoPipeSeparated(detail.genderBirthDisplay)}
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field label="연락처" view={<span>{phoneDisplay || '-'}</span>} />
          <DetailInfoForm.Field label="이메일" view={<span>{emailDisplay || '-'}</span>} />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field label="자택 주소지" view={addressDisplay} />
          <DetailInfoForm.Field
            label="정산 계좌 정보"
            view={renderDetailInfoPipeSeparated(accountDisplay)}
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="지급조서 처리 현황"
            view={
              <span className="payment-order-instructor-status-detail__aggregate-status-value">
                {renderAggregateStatus(aggregateStatus)}
              </span>
            }
          />
          <DetailInfoForm.Field
            label="총 정산 신청 금액"
            view={
              <span className="payment-order-instructor-status-detail__total-amount-cell">
                {formatWon(displayTotalAmount)}
              </span>
            }
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </div>
  )
}
