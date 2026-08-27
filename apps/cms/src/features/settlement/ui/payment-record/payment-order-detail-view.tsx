/**
 * 지급 현황 상세 풀페이지 — 단일 모달·사이드바·산출 내역서 셸 + 본문
 */

import { useMemo, type ReactElement, type ReactNode } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import type { Dayjs } from 'dayjs'
import type {
  PaymentOrderAdminInstructorDetail,
  PaymentOrderAdminInstructorDetailProgramRow,
  PaymentOrderAdminInstructorRow,
  PaymentOrderAdminProgramDetail,
  PaymentOrderAdminProgramDetailInstructorRow,
  PaymentOrderAdminProgramRow,
  PaymentOrderProgramCalculationStatement,
} from '@/data/mock/payment-order-admin-list'
import type { PaymentOrderDetailAggregateStatus } from '@/shared/constants/payment-order-aggregate-status'
import type { PaymentOrdersDetailContextQueryResult } from '@/features/settlement-management/hooks/use-payment-orders-detail-query'
import { usePaymentOrderDetailInstructorPrivacyReveal } from './use-payment-order-detail-instructor-privacy'
import { usePaymentOrderStatementCommitBridge } from './use-payment-order-statement-commit-bridge'
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
import { PaymentOrderDetailFilterTable } from './payment-order-detail-filter-table'
import { PaymentOrderCalculationStatementModalImpl } from './payment-order-calculation-statement-modal-impl'
import { PaymentOrderInstructorBasicInfo } from '@/pages/settlement-management/payment-order-instructor-basic-info'
import { PaymentOrderProgramBasicInfo } from '@/pages/settlement-management/payment-order-program-basic-info'
import { PaymentOrderStatusDetailLnbIcon } from '@/pages/settlement-management/payment-order-status-detail-lnb-icon'
import {
  PAYMENT_ORDERS_DETAIL_KEY_PARAM,
  PAYMENT_ORDERS_DETAIL_NO_PARAM,
  PAYMENT_ORDERS_DETAIL_TYPE_PARAM,
} from '@/pages/settlement-management/payment-orders-table.config'
import '@/features/program/general/ui/detail-modal/program-status/program-status-participating-shared.css'
import '@/pages/settlement-management/payment-order-program-status-detail-fullpage-modal.css'
import '@/pages/settlement-management/payment-order-instructor-status-detail-fullpage-modal.css'

export type PaymentOrderCalculationStatementLineRow =
  | PaymentOrderAdminProgramDetailInstructorRow
  | PaymentOrderAdminInstructorDetailProgramRow

type PaymentOrderDetailViewShared = {
  isOpen: boolean
  /** 목록 페이지에 조회 적용된 기간 — 상세 기간 필터와 동기화 */
  listPageDateRange: [Dayjs, Dayjs] | null
  lineAggregateStatus: PaymentOrderDetailAggregateStatus
  handleAggregateChange: (status: PaymentOrderDetailAggregateStatus) => void
  /** rowsState 기준 반려·정정 제외 합산. null이면 detail.totalEstimatedAmount 사용 */
  lineCountableAmount: number | null
  handleCountableAmountChange: (amount: number) => void
  calcStatementOpen: boolean
  calcStatementData: PaymentOrderProgramCalculationStatement | null
  calcStatementLoading?: boolean
  calcStatementError?: unknown
  calcStatementId?: number | null
  openCalculationStatement: (lineRow: PaymentOrderCalculationStatementLineRow) => void
  closeCalculationStatement: () => void
  resetCalcAndClose: () => void
  paymentOrdersRemote?: boolean
  detailContextQuery?: PaymentOrdersDetailContextQueryResult
  /** 상세 GET 첫 응답 전 — 같은 풀페이지 모달 인스턴스에서 스피너만 교체 */
  contentLoading?: boolean
  /** 상세 GET 실패. loading이 우선 */
  contentError?: ReactNode
}

type PaymentOrderDetailViewProgramBranch = {
  kind: 'program'
  title: string
  modalClassName: undefined
  detail: PaymentOrderAdminProgramDetail | null
  row: PaymentOrderAdminProgramRow
}

type PaymentOrderDetailViewInstructorBranch = {
  kind: 'instructor'
  title: string
  modalClassName: string
  detail: PaymentOrderAdminInstructorDetail | null
  row: PaymentOrderAdminInstructorRow
}

export type PaymentOrderDetailViewProps = PaymentOrderDetailViewShared &
  (PaymentOrderDetailViewProgramBranch | PaymentOrderDetailViewInstructorBranch)

export function PaymentOrderDetailView(props: PaymentOrderDetailViewProps): ReactElement {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const {
    isOpen,
    kind,
    title,
    modalClassName,
    detail,
    row,
    listPageDateRange,
    lineAggregateStatus,
    handleAggregateChange,
    lineCountableAmount,
    handleCountableAmountChange,
    calcStatementOpen,
    calcStatementData,
    calcStatementLoading,
    calcStatementError,
    calcStatementId,
    openCalculationStatement,
    closeCalculationStatement,
    resetCalcAndClose,
    paymentOrdersRemote,
    detailContextQuery,
    contentLoading = false,
    contentError = null,
  } = props

  const instructorRowKey = kind === 'instructor' ? row.no : null

  const { registerStatementCommitSink, handleStatementLineCommitted } =
    usePaymentOrderStatementCommitBridge(closeCalculationStatement)

  const {
    personalInfoRevealed,
    onPrivacyControlClick: handlePrivacyToggleClick,
    confirmModal: personalInfoRevealModal,
  } = usePaymentOrderDetailInstructorPrivacyReveal({
    isOpen,
    kind,
    instructorRowKey,
    detail,
  })

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

  const sidebar = (
    <DetailModalSidebar
      navAriaLabel="지급 현황 상세 메뉴"
      items={sidebarItems}
      activeKey="payment-status-detail"
      activeChildKey=""
      expandedGroupKeys={[]}
      onSelectTop={() => {}}
      onSelectChild={() => {}}
    />
  )

  /** 풀페이지 상단 여백 제거·프로그램/강사별 기존 스코프 클래스 병행 */
  const detailModalRootClass = [
    'payment-order-status-detail-fullpage-modal',
    kind === 'instructor'
      ? 'payment-order-instructor-status-detail-fullpage-modal'
      : 'payment-order-program-status-detail-fullpage-modal',
    modalClassName,
  ]
    .filter((c): c is string => typeof c === 'string' && c.trim().length > 0)
    .join(' ')

  const headerBreadcrumbItems = [
    makeBreadcrumbItem(
      '지급조서 확인',
      location.pathname,
      buildSearchParams(searchParams, {
        delete: [
          PAYMENT_ORDERS_DETAIL_TYPE_PARAM,
          PAYMENT_ORDERS_DETAIL_NO_PARAM,
          PAYMENT_ORDERS_DETAIL_KEY_PARAM,
        ],
      })
    ),
    { label: title },
  ]

  const mainContent =
    kind === 'program' && detail ? (
      <>
        <PaymentOrderProgramBasicInfo detail={detail} aggregateStatus={lineAggregateStatus} />
        <PaymentOrderDetailFilterTable
          mode="program"
          programRow={row}
          isOpen={isOpen}
          listPageDateRange={listPageDateRange}
          onAggregateChange={handleAggregateChange}
          onCountableAmountChange={handleCountableAmountChange}
          onOpenCalculationStatement={openCalculationStatement}
          registerStatementCommitSink={registerStatementCommitSink}
          paymentOrdersRemote={paymentOrdersRemote}
          detailContextQuery={detailContextQuery}
        />
      </>
    ) : kind === 'instructor' && detail ? (
      <>
        <PaymentOrderInstructorBasicInfo
          detail={detail}
          aggregateStatus={lineAggregateStatus}
          totalEstimatedAmount={lineCountableAmount ?? detail.totalEstimatedAmount}
          personalInfoRevealed={personalInfoRevealed}
          onPersonalInfoButtonClick={handlePrivacyToggleClick}
        />
        <PaymentOrderDetailFilterTable
          mode="instructor"
          instructorRow={row}
          isOpen={isOpen}
          listPageDateRange={listPageDateRange}
          onAggregateChange={handleAggregateChange}
          onCountableAmountChange={handleCountableAmountChange}
          onOpenCalculationStatement={openCalculationStatement}
          registerStatementCommitSink={registerStatementCommitSink}
          paymentOrdersRemote={paymentOrdersRemote}
          detailContextQuery={detailContextQuery}
        />
      </>
    ) : null

  return (
    <>
      {kind === 'instructor' ? personalInfoRevealModal : null}
      <PaymentOrderCalculationStatementModalImpl
        entryKind={kind === 'program' ? 'instructor' : 'program'}
        entryClassName={
          kind === 'program'
            ? 'payment-order-calc-statement-modal--entry-instructor'
            : 'payment-order-calc-statement-modal--entry-program'
        }
        open={calcStatementOpen}
        onCancel={closeCalculationStatement}
        data={calcStatementData}
        loading={calcStatementLoading}
        loadError={calcStatementError}
        paymentOrdersRemote={paymentOrdersRemote}
        statementId={calcStatementId}
        detailContextQuery={detailContextQuery}
        onStatementLineCommitted={handleStatementLineCommitted}
        onAfterRejectResultClosed={closeCalculationStatement}
      />
      <DetailFullPageModal
        open={isOpen}
        onClose={resetCalcAndClose}
        title={title}
        loading={contentLoading}
        error={contentError}
        headerTrailing={<DetailFullpageBreadcrumb items={headerBreadcrumbItems} />}
        className={detailModalRootClass}
        sidebar={sidebar}
      >
        <div className="payment-order-program-status-detail__root">{mainContent}</div>
      </DetailFullPageModal>
    </>
  )
}
