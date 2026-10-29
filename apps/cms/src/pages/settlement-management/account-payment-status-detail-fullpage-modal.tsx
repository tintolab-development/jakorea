/**
 * 정산 관리 > 계좌 지급 확인 — 행 클릭 시 [계좌 지급 현황 상세] 풀페이지 모달
 */

import { useEffect, useMemo, useState } from 'react'
import { ACCOUNT_PAYMENT_DETAIL_FORBIDDEN_ALERT_MESSAGE } from '@/shared/constants/messages'
import { getApiErrorHttpStatus } from '@/shared/lib/extract-api-error-message'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { canAccessAccountPayments } from '@/shared/lib/account-payments-access'
import { useLocation, useSearchParams } from 'react-router-dom'
import { DetailFullPageModal } from '@/shared/ui/detail-fullpage-modal'
import { DetailFullpageBreadcrumb } from '@/shared/ui/detail-fullpage-breadcrumb'
import { buildSearchParams, makeBreadcrumbItem } from '@/shared/lib/detail-fullpage-query-stack'
import {
  DetailModalSidebar,
  type DetailModalSidebarNavItem,
} from '@/shared/ui/detail-modal-sidebar'
import { CmsButton } from '@/shared/ui'
import '@/features/program/general/ui/detail-modal/program-status/program-status-participating-shared.css'
import type { AccountPaymentRow } from '@/features/settlement-management/model/account-payments-list'
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
import { computePaymentOrderCalculationSubtotalBeforeWithholding } from '@/features/settlement/ui/payment-record/payment-order-calculation-basis-detail'
import {
  AccountPaymentConfirmationModal,
  buildAccountPaymentSingleConfirmationPayload,
} from '@/features/settlement/ui/account-payment-confirmation-modal'
import { AccountPaymentStatusDetailBasicInfo } from './account-payment-status-detail-basic-info'
import './account-payment-status-detail-fullpage-modal.css'

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
  const { user } = useAuthStore()
  const canCompleteAccountPayment = canAccessAccountPayments(user)
  const accountPaymentsRemote = shouldUseSettlementRemote('accountPayments')
  const detailQuery = useAccountPaymentDetailQuery(row, open && accountPaymentsRemote)

  const detail = accountPaymentsRemote ? (detailQuery.data ?? null) : null
  const detailLoading = accountPaymentsRemote && open && isAwaitingFirstQueryData(detailQuery)
  const detailError = accountPaymentsRemote
    ? detailQuery.error
    : open
      ? new Error('계좌 지급 API가 연결되지 않았습니다.')
      : null
  const detailForbidden = getApiErrorHttpStatus(detailError) === 403
  const { showAlert } = useCmsAlert()

  useEffect(() => {
    if (!open || !detailForbidden) return
    onClose()
    void showAlert({ title: '권한 없음', content: ACCOUNT_PAYMENT_DETAIL_FORBIDDEN_ALERT_MESSAGE })
  }, [open, detailForbidden, onClose, showAlert])

  const [paymentCompleteConfirmOpen, setPaymentCompleteConfirmOpen] = useState(false)
  const [issuanceViewOpen, setIssuanceViewOpen] = useState(false)
  const basisDetailContext = useMemo(() => {
    const subtotalBeforeWithholding = detail
      ? computePaymentOrderCalculationSubtotalBeforeWithholding(detail.blocks)
      : 0
    return {
      lectureFeeStandardTitle: detail?.basic.lectureFeeStandardTitle,
      withholdingDailySalaryTotalWon:
        subtotalBeforeWithholding > 0 ? subtotalBeforeWithholding : undefined,
    }
  }, [detail])

  const { basisDetailOpen, selectedBasisDetail, handleBasisDetailClick, closeBasisDetailModal } =
    usePaymentOrderCalculationBasisDetailModal(open, basisDetailContext)

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
  const instructorDisplayName =
    basic?.nameKo?.trim() || row.instructorName?.trim() || '신청자'
  const title = `계좌 지급 확인 현황 상세 (${instructorDisplayName})`
  const headerBreadcrumbItems = [
    makeBreadcrumbItem(
      '계좌 지급 확인',
      location.pathname,
      buildSearchParams(searchParams, { delete: ['ap_detail'] })
    ),
    { label: instructorDisplayName },
  ]

  return (
    <>
      <DetailFullPageModal
        open={open}
        onClose={onClose}
        title={title}
        loading={detailLoading}
        error={
          !detailLoading && !detailForbidden && (detailError || !detail)
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
            <AccountPaymentStatusDetailBasicInfo basic={basic} />

            <div className="account-payment-status-detail-fullpage-modal__calc-host">
              <PaymentOrderCalculationBreakdownTable
                blocks={detail.blocks}
                formulaLabel={detail.formulaLabel}
                totalAmount={detail.totalAmount}
                lectureSessionSegmentLabel="round"
                onBasisDetailClick={handleBasisDetailClick}
                onDownloadPaymentStatement={() => setIssuanceViewOpen(true)}
                headerActions={
                  row.accountPaymentStatus === 'account_paid' || !canCompleteAccountPayment
                    ? undefined
                    : (
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
        open={paymentCompleteConfirmOpen && canCompleteAccountPayment}
        onCancel={() => setPaymentCompleteConfirmOpen(false)}
        onConfirm={() => {
          onAccountPaymentCompleted?.(row.id)
          setPaymentCompleteConfirmOpen(false)
        }}
        data={paymentCompleteConfirmOpen ? singlePaymentConfirmPayload : null}
      />
      <PaymentStatementIssuanceViewModal
        open={issuanceViewOpen && Boolean(issuanceParagraphBodyOptions)}
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
    </>
  )
}
