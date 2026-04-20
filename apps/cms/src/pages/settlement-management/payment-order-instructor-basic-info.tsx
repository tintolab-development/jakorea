/**
 * 지급 현황 상세 — 강사 기본 정보 블록
 */

import { MASKING_POLICY } from '@/shared/constants/download-policy'
import type { PaymentOrderAdminInstructorDetail } from '@/data/mock/payment-order-admin-list'
import type { PaymentOrderDetailAggregateStatus } from '@/shared/constants/payment-order-aggregate-status'
import { PersonalInfoRevealButton } from '@/features/user/detail/ui/personal-info-reveal-button'
import { formatWon } from './payment-order-detail-fullpage-shared'
import { renderAggregateStatus } from './payment-order-detail-aggregate-status'
import '@/features/program/program-detail/ui/applicant-list/applicant-instructor-basic-info.css'

export interface PaymentOrderInstructorBasicInfoProps {
  detail: PaymentOrderAdminInstructorDetail
  aggregateStatus: PaymentOrderDetailAggregateStatus
  personalInfoRevealed: boolean
  onPersonalInfoButtonClick: () => void
}

/** 읍·면·동 단위까지 노출, 이후는 블러 (신청 강사 기본정보와 동일 규칙) */
function splitAddressAfterDong(address: string): { head: string; tail: string } | null {
  const re = /(?:^|\s)([가-힣]{2,12}동)(?=\s|$)/u
  const m = address.match(re)
  if (!m) return null
  const dong = m[1]
  const i = address.indexOf(dong)
  if (i === -1) return null
  const end = i + dong.length
  return { head: address.slice(0, end), tail: address.slice(end) }
}

function AddressBlurDisplay({ address }: { address: string }) {
  if (!address) return <>-</>
  const split = splitAddressAfterDong(address)
  if (!split) {
    return <>{MASKING_POLICY.address(address)}</>
  }
  const { head, tail } = split
  if (!tail.trim()) {
    return <>{head}</>
  }
  return (
    <>
      {head}
      <span className="applicant-instructor-basic-info__address-blur" aria-hidden="true">
        {tail}
      </span>
    </>
  )
}

export function PaymentOrderInstructorBasicInfo({
  detail,
  aggregateStatus,
  personalInfoRevealed,
  onPersonalInfoButtonClick,
}: PaymentOrderInstructorBasicInfoProps) {
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
      <div className="applicant-instructor-basic-info payment-order-instructor-status-detail__basic-applicant">
        <div className="payment-order-instructor-status-detail__basic-header">
          <div className="applicant-instructor-basic-info__title">기본 정보</div>
          <PersonalInfoRevealButton
            ui="app"
            labelMode="toggle"
            revealed={personalInfoRevealed}
            variant="primary"
            size="filter"
            onClick={onPersonalInfoButtonClick}
          />
        </div>
        <div className="applicant-instructor-basic-info__table-wrap">
          <table className="applicant-instructor-basic-info__table payment-order-instructor-status-detail__basic-table">
            <colgroup>
              <col style={{ width: 120 }} />
              <col style={{ width: 80 }} />
              <col />
              <col style={{ width: 200, minWidth: 200, maxWidth: 200 }} />
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
                  {detail.nameKo}
                </td>
                <td
                  className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label payment-order-instructor-status-detail__label-cell--wide"
                >
                  연락처
                </td>
                <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                  {phoneDisplay}
                </td>
              </tr>
              <tr>
                <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label">
                  영문
                </td>
                <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                  {detail.nameEn}
                </td>
                <td
                  className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label payment-order-instructor-status-detail__label-cell--wide"
                >
                  이메일
                </td>
                <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                  {emailDisplay}
                </td>
              </tr>
              <tr>
                <td
                  colSpan={2}
                  className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label payment-order-instructor-status-detail__label-cell--wide payment-order-instructor-status-detail__label-cell--span2"
                >
                  자택 주소
                </td>
                <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                  {addressDisplay}
                </td>
                <td
                  className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label payment-order-instructor-status-detail__label-cell--wide"
                >
                  정산 계좌 정보
                </td>
                <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                  {accountDisplay}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div
          className="applicant-instructor-basic-info__table-wrap payment-order-instructor-status-detail__aggregate-table-wrap"
          aria-label="지급 조서 처리 현황 및 총 정산 예정 금액"
        >
          <table className="applicant-instructor-basic-info__table payment-order-instructor-status-detail__aggregate-table">
            <colgroup>
              <col style={{ width: 120 }} />
              <col style={{ width: 80 }} />
              <col />
              <col style={{ width: 200, minWidth: 200, maxWidth: 200 }} />
              <col />
            </colgroup>
            <tbody>
              <tr className="payment-order-instructor-status-detail__aggregate-row">
                <td
                  colSpan={2}
                  className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label payment-order-instructor-status-detail__label-cell--wide payment-order-instructor-status-detail__label-cell--span2"
                >
                  지급 조서 처리 현황
                </td>
                <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value payment-order-instructor-status-detail__aggregate-status-value">
                  {renderAggregateStatus(aggregateStatus)}
                </td>
                <td
                  className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label payment-order-instructor-status-detail__label-cell--wide"
                >
                  총 정산 예정 금액
                </td>
                <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value payment-order-instructor-status-detail__total-amount-cell">
                  {aggregateStatus === 'rejected' ||
                  aggregateStatus === 'na' ||
                  aggregateStatus === 'application_rejected'
                    ? '-'
                    : formatWon(detail.totalEstimatedAmount)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
