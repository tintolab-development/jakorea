/**
 * 지급 현황 상세 풀페이지 — 단일 모달·사이드바·산출 내역서 셸 + 본문
 */

import { useMemo, type ReactElement } from 'react'
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
import { PaymentOrderInstructorCalculationStatementModal } from './payment-order-instructor-calculation-statement-modal'
import { PaymentOrderProgramCalculationStatementModal } from './payment-order-program-calculation-statement-modal'
import { PaymentOrderInstructorBasicInfo } from '@/pages/settlement-management/payment-order-instructor-basic-info'
import { PaymentOrderProgramBasicInfo } from '@/pages/settlement-management/payment-order-program-basic-info'
import { PaymentOrderStatusDetailLnbIcon } from '@/pages/settlement-management/payment-order-status-detail-lnb-icon'
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
  calcStatementOpen: boolean
  calcStatementData: PaymentOrderProgramCalculationStatement | null
  openCalculationStatement: (lineRow: PaymentOrderCalculationStatementLineRow) => void
  closeCalculationStatement: () => void
  resetCalcAndClose: () => void
}

type PaymentOrderDetailViewProgramBranch = {
  kind: 'program'
  title: string
  modalClassName: undefined
  detail: PaymentOrderAdminProgramDetail
  row: PaymentOrderAdminProgramRow
}

type PaymentOrderDetailViewInstructorBranch = {
  kind: 'instructor'
  title: string
  modalClassName: string
  detail: PaymentOrderAdminInstructorDetail
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
    calcStatementOpen,
    calcStatementData,
    openCalculationStatement,
    closeCalculationStatement,
    resetCalcAndClose,
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
      buildSearchParams(searchParams, { delete: ['po_detail', 'po_detail_no'] })
    ),
    { label: title },
  ]

  const mainContent = (
    <>
      {kind === 'program' ? (
        <PaymentOrderProgramBasicInfo detail={detail} aggregateStatus={lineAggregateStatus} />
      ) : (
        <PaymentOrderInstructorBasicInfo
          detail={detail}
          aggregateStatus={lineAggregateStatus}
          personalInfoRevealed={personalInfoRevealed}
          onPersonalInfoButtonClick={handlePrivacyToggleClick}
        />
      )}
      {kind === 'program' ? (
        <PaymentOrderDetailFilterTable
          mode="program"
          programRow={row}
          isOpen={isOpen}
          listPageDateRange={listPageDateRange}
          onAggregateChange={handleAggregateChange}
          onOpenCalculationStatement={openCalculationStatement}
          registerStatementCommitSink={registerStatementCommitSink}
        />
      ) : (
        <PaymentOrderDetailFilterTable
          mode="instructor"
          instructorRow={row}
          isOpen={isOpen}
          listPageDateRange={listPageDateRange}
          onAggregateChange={handleAggregateChange}
          onOpenCalculationStatement={openCalculationStatement}
          registerStatementCommitSink={registerStatementCommitSink}
        />
      )}
    </>
  )

  return (
    <>
      {kind === 'instructor' ? personalInfoRevealModal : null}
      {kind === 'program' ? (
        <PaymentOrderProgramCalculationStatementModal
          open={calcStatementOpen}
          onCancel={closeCalculationStatement}
          data={calcStatementData}
          onStatementLineCommitted={handleStatementLineCommitted}
          onAfterRejectResultClosed={closeCalculationStatement}
        />
      ) : (
        <PaymentOrderInstructorCalculationStatementModal
          open={calcStatementOpen}
          onCancel={closeCalculationStatement}
          data={calcStatementData}
          onStatementLineCommitted={handleStatementLineCommitted}
          onAfterRejectResultClosed={closeCalculationStatement}
        />
      )}
      <DetailFullPageModal
        open={isOpen}
        onClose={resetCalcAndClose}
        title={title}
        headerTrailing={<DetailFullpageBreadcrumb items={headerBreadcrumbItems} />}
        className={detailModalRootClass}
        sidebar={sidebar}
      >
        <div className="payment-order-program-status-detail__root">{mainContent}</div>
      </DetailFullPageModal>
    </>
  )
}
