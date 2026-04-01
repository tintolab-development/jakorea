/**
 * 정산 관리 > 계좌 지급 확인 — 행 클릭 시 계좌 지급 현황 상세 풀페이지 모달
 * 본문 패딩·기본 정보 블록: 지급조서 확인 > 강사별 지급 현황 상세와 동일 패턴
 */

import { useMemo, useState } from 'react'
import { message } from 'antd'
import { DetailFullPageModal } from '@/shared/ui/detail-fullpage-modal'
import {
  DetailModalSidebar,
  type DetailModalSidebarNavItem,
} from '@/shared/ui/detail-modal-sidebar'
import { AppButton } from '@/shared/ui/app-button'
import { withProgramDetailTdDivider } from '@/features/program/ui/program-detail-td-divider'
import '@/features/program/ui/detail-modal/program-status/participating-institutions-section.css'
import type { AccountPaymentRow } from '@/data/mock/account-payments-list'
import { getMockAccountPaymentStatusDetail } from '@/data/mock/account-payments-list'
import '@/features/program/ui/detail-modal/applicants/applicant-instructor-basic-info.css'
import '@/features/program/ui/detail-modal/project-info/project-info-form-shared.css'
import './payment-order-admin-status-tag.css'
import './payment-order-program-calculation-statement-modal.css'
import './account-payments-page.css'
import { PaymentOrderStatusDetailLnbIcon } from './payment-order-status-detail-lnb-icon'
import { PaymentOrderCalculationBreakdownTable } from './payment-order-calculation-breakdown-table'
import {
  AccountPaymentConfirmationModal,
  buildAccountPaymentSingleConfirmationPayload,
} from './account-payment-confirmation-modal'
import './account-payment-status-detail-fullpage-modal.css'

export interface AccountPaymentStatusDetailFullPageModalProps {
  open: boolean
  onClose: () => void
  row: AccountPaymentRow | null
}

export function AccountPaymentStatusDetailFullPageModal({
  open,
  onClose,
  row,
}: AccountPaymentStatusDetailFullPageModalProps) {
  const detail = useMemo(() => (row ? getMockAccountPaymentStatusDetail(row) : null), [row])
  const [paymentCompleteConfirmOpen, setPaymentCompleteConfirmOpen] = useState(false)

  const singlePaymentConfirmPayload = useMemo(
    () => (detail ? buildAccountPaymentSingleConfirmationPayload(detail) : null),
    [detail]
  )

  const sidebarItems = useMemo<DetailModalSidebarNavItem[]>(
    () => [
      {
        key: 'payment-status-detail',
        label: '지급 현황 상세',
        icon: <PaymentOrderStatusDetailLnbIcon className="detail-fullpage-modal__lnb-icon" />,
      },
    ],
    []
  )

  if (!open || !row || !detail) {
    return null
  }

  const { basic } = detail

  const basicColgroup = (
    <colgroup>
      <col className="account-payment-status-detail-fullpage-modal__col-label-main" />
      <col className="account-payment-status-detail-fullpage-modal__col-label-sub" />
      <col />
      <col className="account-payment-status-detail-fullpage-modal__col-label-side" />
      <col />
    </colgroup>
  )

  return (
    <>
    <DetailFullPageModal
      open={open}
      onClose={onClose}
      title="계좌 지급 현황 상세"
      className="account-payment-status-detail-fullpage-modal"
      sidebar={
        <DetailModalSidebar
          navAriaLabel="계좌 지급 현황 상세 메뉴"
          items={sidebarItems}
          activeKey="payment-status-detail"
          activeChildKey=""
          expandedGroupKeys={[]}
          onSelectTop={() => {}}
          onSelectChild={() => {}}
        />
      }
    >
      <div className="payment-order-program-status-detail__root participating-institutions-section account-payment-status-detail-fullpage-modal__root">
        <div className="account-payment-status-detail-fullpage-modal__basic-block program-detail-fullpage-modal__info-tab-block">
          <div className="applicant-instructor-basic-info payment-order-instructor-status-detail__basic-applicant">
            <div className="applicant-instructor-basic-info__title">기본 정보</div>
            <div className="account-payment-status-detail-fullpage-modal__basic-stack">
              {/* ① 성명 · 자택 주소 · 연락처 · 이메일 · 정산 계좌 */}
              <div className="applicant-instructor-basic-info__table-wrap payment-order-calc-statement-modal__basic-applicant-wrap">
                <table className="applicant-instructor-basic-info__table account-payment-status-detail-fullpage-modal__basic-table">
                  {basicColgroup}
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
                        {basic.nameKo}
                      </td>
                      <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label">
                        연락처
                      </td>
                      <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                        {basic.phoneDisplay}
                      </td>
                    </tr>
                    <tr>
                      <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label">
                        영문
                      </td>
                      <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                        {basic.nameEn}
                      </td>
                      <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label">
                        이메일
                      </td>
                      <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                        {basic.emailDisplay}
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
                        {basic.addressBlurredTail ? (
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
                          basic.addressDisplay
                        )}
                      </td>
                      <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label">
                        정산 계좌 정보
                      </td>
                      <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                        <div className="payment-order-calc-statement-modal__td-divider-wrap payment-order-calc-statement-modal__td-divider-wrap--start">
                          {withProgramDetailTdDivider([
                            basic.settlementAccountBankNumberPart,
                            basic.settlementAccountHolderPart,
                          ])}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* ② 프로그램명 + 프로그램 진행 회차 | 사업 운영 기간 */}
              <div className="applicant-instructor-basic-info__table-wrap payment-order-calc-statement-modal__basic-applicant-wrap">
                <table className="applicant-instructor-basic-info__table account-payment-status-detail-fullpage-modal__basic-table">
                  {basicColgroup}
                  <tbody>
                    <tr>
                      <td
                        colSpan={2}
                        className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label"
                      >
                        프로그램명
                      </td>
                      <td
                        colSpan={3}
                        className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value"
                      >
                        {basic.programName}
                      </td>
                    </tr>
                    <tr>
                      <td
                        colSpan={2}
                        className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label"
                      >
                        프로그램 진행 회차
                      </td>
                      <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                        {basic.programSessionProgressDisplay}
                      </td>
                      <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label">
                        사업 운영 기간
                      </td>
                      <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                        {basic.businessPeriodDisplay}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* ③ 계좌 지급 · 이체 / 강의비 · 사업소득자 */}
              <div className="applicant-instructor-basic-info__table-wrap payment-order-calc-statement-modal__basic-applicant-wrap">
                <table className="applicant-instructor-basic-info__table account-payment-status-detail-fullpage-modal__basic-table">
                  {basicColgroup}
                  <tbody>
                    <tr>
                      <td
                        colSpan={2}
                        className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label"
                      >
                        계좌 지급 현황
                      </td>
                      <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                        <span
                          className={
                            basic.accountPaymentStatus === 'pending'
                              ? 'account-payments-page__status-text--pending'
                              : 'account-payments-page__status-text--completed'
                          }
                        >
                          {basic.accountPaymentStatusLabel}
                        </span>
                      </td>
                      <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label">
                        이체 예정일
                      </td>
                      <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                        {basic.transferScheduledDateDisplay}
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
                            basic.lectureFeeStandardTitle,
                            basic.lectureFeeStandardAmount,
                          ])}
                        </div>
                      </td>
                      <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--label">
                        사업소득자 여부
                      </td>
                      <td className="applicant-instructor-basic-info__cell applicant-instructor-basic-info__cell--value">
                        {basic.businessIncomeEarnerLabel}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="account-payment-status-detail-fullpage-modal__calc-host">
          <PaymentOrderCalculationBreakdownTable
            blocks={detail.blocks}
            formulaLabel={detail.formulaLabel}
            totalAmount={detail.totalAmount}
            headerActions={
              <AppButton
                variant="primary"
                size="filter"
                modalTeal
                onClick={() => setPaymentCompleteConfirmOpen(true)}
              >
                지급 완료 처리
              </AppButton>
            }
          />
        </div>
      </div>
    </DetailFullPageModal>

    <AccountPaymentConfirmationModal
      open={paymentCompleteConfirmOpen}
      onCancel={() => setPaymentCompleteConfirmOpen(false)}
      onConfirm={() => {
        message.success('계좌 지급 완료 처리되었습니다.')
        setPaymentCompleteConfirmOpen(false)
      }}
      data={paymentCompleteConfirmOpen ? singlePaymentConfirmPayload : null}
    />
    </>
  )
}
