/**
 * 정산 관리 > 계좌 지급 확인 — 행 클릭 시 [계좌 지급 현황 상세] 풀페이지 모달
 */

import { useMemo, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { DetailFullPageModal } from '@/shared/ui/detail-fullpage-modal'
import { DetailFullpageBreadcrumb } from '@/shared/ui/detail-fullpage-breadcrumb'
import {
  buildSearchParams,
  makeBreadcrumbItem,
} from '@/shared/lib/detail-fullpage-query-stack'
import {
  DetailModalSidebar,
  type DetailModalSidebarNavItem,
} from '@/shared/ui/detail-modal-sidebar'
import { CmsButton } from '@/shared/ui'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { withProgramDetailTdDivider } from '@/features/program/shared/ui/program-detail-td-divider'
import '@/features/program/general/ui/detail-modal/program-status/program-status-participating-shared.css'
import type { AccountPaymentRow } from '@/data/mock/account-payments-list'
import { getMockAccountPaymentStatusDetail } from '@/data/mock/account-payments-list'
import { useAccountPaymentDetailQuery } from '@/features/settlement-management/hooks/use-account-payment-detail-query'
import { shouldUseSettlementRemote } from '@/features/settlement-management/hooks/use-settlement-remote-enabled'
import { isAwaitingFirstQueryData } from '@/shared/lib/is-awaiting-first-query-data'
import {
  buildPaymentStatementIssuanceFileNameFromCalculation,
  buildPaymentStatementIssuanceViewOptionsFromCalculation,
  mapAccountPaymentStatusDetailToIssuanceInput,
} from '@/features/settlement/lib/payment-order-calculation-statement-issuance-view'
import { PaymentStatementIssuanceViewModal } from '@/features/program/shared/ui/payment-statement-issuance-view-modal'
import '@/features/program/shared/ui/program-detail/applicant-list/applicant-instructor-basic-info.css'
import './payment-order-admin-status-tag.css'
import '@/features/settlement/ui/payment-record/payment-order-program-calculation-statement-modal.css'
import { PaymentOrderStatusDetailLnbIcon } from './payment-order-status-detail-lnb-icon'
import { PaymentOrderCalculationBreakdownTable } from '@/features/settlement/ui/payment-record/payment-order-calculation-breakdown-table'
import {
  PaymentOrderCalculationBasisDetailModal,
  usePaymentOrderCalculationBasisDetailModal,
} from '@/features/settlement/ui/payment-record/payment-order-calculation-basis-detail-modal'
import { SettlementItemSettingDetailModal } from '@/pages/settlement-management/settlement-item-setting-detail-modal'
import {
  AccountPaymentConfirmationModal,
  buildAccountPaymentSingleConfirmationPayload,
} from '@/features/settlement/ui/account-payment-confirmation-modal'
import './account-payment-status-detail-fullpage-modal.css'

function getAccountPaymentStatusClassName(status: AccountPaymentRow['accountPaymentStatus']): string {
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

export interface AccountPaymentStatusDetailFullPageModalProps {
  open: boolean
  onClose: () => void
  row: AccountPaymentRow | null
  /** 계좌 지급 완료 확인 시 목록·상세의 `accountPaymentStatus`를 갱신 */
  onAccountPaymentCompleted?: (rowId: string) => void
}

export function AccountPaymentStatusDetailFullPageModal({
  open,
  onClose,
  row,
  onAccountPaymentCompleted,
}: AccountPaymentStatusDetailFullPageModalProps) {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const accountPaymentsRemote = shouldUseSettlementRemote('accountPayments')
  const detailQuery = useAccountPaymentDetailQuery(row, open && accountPaymentsRemote)

  const mockDetail = useMemo(
    () => (row && !accountPaymentsRemote ? getMockAccountPaymentStatusDetail(row) : null),
    [row, accountPaymentsRemote]
  )
  const detail = accountPaymentsRemote ? (detailQuery.data ?? null) : mockDetail
  const detailLoading = accountPaymentsRemote && open && isAwaitingFirstQueryData(detailQuery)
  const detailError = accountPaymentsRemote ? detailQuery.error : null

  const [paymentCompleteConfirmOpen, setPaymentCompleteConfirmOpen] = useState(false)
  const [issuanceViewOpen, setIssuanceViewOpen] = useState(false)
  const {
    basisDetailOpen,
    selectedBasisDetail,
    handleBasisDetailClick,
    closeBasisDetailModal,
    wageSettingItemOpen,
    wageSettingItem,
    closeWageSettingItemModal,
  } = usePaymentOrderCalculationBasisDetailModal(open, {
    lectureFeeStandardTitle: detail?.basic.lectureFeeStandardTitle,
  })

  const singlePaymentConfirmPayload = useMemo(
    () => (detail ? buildAccountPaymentSingleConfirmationPayload(detail) : null),
    [detail]
  )

  const issuanceInput = useMemo(
    () => (detail ? mapAccountPaymentStatusDetailToIssuanceInput(detail) : null),
    [detail]
  )

  const issuanceParagraphBodyOptions = useMemo(
    () =>
      issuanceInput
        ? buildPaymentStatementIssuanceViewOptionsFromCalculation(issuanceInput)
        : undefined,
    [issuanceInput]
  )

  const issuanceFileName = useMemo(
    () =>
      issuanceInput
        ? buildPaymentStatementIssuanceFileNameFromCalculation(issuanceInput)
        : undefined,
    [issuanceInput]
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

  if (!open || !row) {
    return null
  }

  const { basic } = detail ?? { basic: null }
  const title = '계좌 지급 현황 상세'
  const headerBreadcrumbItems = [
    makeBreadcrumbItem(
      '계좌 지급 확인',
      location.pathname,
      buildSearchParams(searchParams, { delete: ['ap_detail'] })
    ),
    { label: title },
  ]

  return (
    <>
      <DetailFullPageModal
        open={open}
        onClose={onClose}
        title={title}
        loading={detailLoading}
        error={
          !detailLoading && (detailError || !detail)
            ? detailError instanceof Error
              ? detailError.message
              : '상세를 불러오지 못했습니다.'
            : null
        }
        headerTrailing={<DetailFullpageBreadcrumb items={headerBreadcrumbItems} />}
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
        {detail && basic ? (
        <div className="account-payment-status-detail-fullpage-modal__root">
          <div className="account-payment-status-detail-fullpage-modal__basic-stack">
            <DetailInfoForm
              title="기본 정보"
              className="account-payment-status-detail-fullpage-modal__detail-form-card"
            >
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.NameBlock
                  rows={[
                    {
                      subLabel: '한글',
                      main: <span>{basic.nameKo}</span>,
                      sideLabel: '연락처',
                      side: <span>{basic.phoneDisplay}</span>,
                    },
                    {
                      subLabel: '영문',
                      main: <span>{basic.nameEn}</span>,
                      sideLabel: '이메일',
                      side: <span>{basic.emailDisplay}</span>,
                    },
                  ]}
                />
              </DetailInfoForm.Row>
              <DetailInfoForm.Row type="double">
                <DetailInfoForm.Field
                  label="자택 주소"
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
                      <span>{basic.addressDisplay}</span>
                    )
                  }
                />
                <DetailInfoForm.Field
                  label="정산 계좌 정보"
                  view={
                    <div className="payment-order-calc-statement-modal__td-divider-wrap payment-order-calc-statement-modal__td-divider-wrap--start">
                      {withProgramDetailTdDivider([
                        basic.settlementAccountBankNumberPart,
                        basic.settlementAccountHolderPart,
                      ])}
                    </div>
                  }
                />
              </DetailInfoForm.Row>
            </DetailInfoForm>

            <DetailInfoForm
              title="프로그램명, 진행 회차, 사업 운영 기간"
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
            </DetailInfoForm>

            <DetailInfoForm
              title="계좌 지급 현황, 이체 예정일, 강의비, 사업소득자"
              hideHeader
              className="account-payment-status-detail-fullpage-modal__detail-form-card"
            >
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
                  view={<span>{basic.transferScheduledDateDisplay}</span>}
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

          <div className="account-payment-status-detail-fullpage-modal__calc-host">
            <PaymentOrderCalculationBreakdownTable
              blocks={detail.blocks}
              formulaLabel={detail.formulaLabel}
              totalAmount={detail.totalAmount}
              lectureSessionSegmentLabel="round"
              onBasisDetailClick={handleBasisDetailClick}
              onDownloadPaymentStatement={() => setIssuanceViewOpen(true)}
              headerActions={
                row.accountPaymentStatus === 'account_paid' ? undefined : (
                  <CmsButton
                    variant="primary"
                    size="large"
                    width={160}
                    onClick={() => setPaymentCompleteConfirmOpen(true)}
                  >
                    지급 완료 처리
                  </CmsButton>
                )
              }
            />
          </div>
        </div>
        ) : null}
      </DetailFullPageModal>

      <AccountPaymentConfirmationModal
        open={paymentCompleteConfirmOpen}
        onCancel={() => setPaymentCompleteConfirmOpen(false)}
        onConfirm={() => {
          onAccountPaymentCompleted?.(row.id)
          setPaymentCompleteConfirmOpen(false)
        }}
        data={paymentCompleteConfirmOpen ? singlePaymentConfirmPayload : null}
      />
      <PaymentStatementIssuanceViewModal
        open={issuanceViewOpen}
        onClose={() => setIssuanceViewOpen(false)}
        paragraphBodyOptions={issuanceParagraphBodyOptions}
        fileName={issuanceFileName}
        zIndex={1500}
      />
      <PaymentOrderCalculationBasisDetailModal
        open={basisDetailOpen}
        onCancel={closeBasisDetailModal}
        detail={selectedBasisDetail}
        zIndex={1200}
      />
      <SettlementItemSettingDetailModal
        open={wageSettingItemOpen}
        onCancel={closeWageSettingItemModal}
        item={wageSettingItem}
        readOnly
      />
    </>
  )
}
