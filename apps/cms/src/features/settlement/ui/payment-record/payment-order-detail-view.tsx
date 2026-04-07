/**
 * 지급 현황 상세 풀페이지 — 단일 모달·사이드바·산출 내역서 셸 + 본문
 */

import { useMemo, type ComponentType, type ReactElement } from 'react'
import type { PaymentOrderInstructorBasicInfoProps } from '@/pages/settlement-management/payment-order-instructor-basic-info'
import type { PaymentOrderProgramBasicInfoProps } from '@/pages/settlement-management/payment-order-program-basic-info'
import { DetailFullPageModal } from '@/shared/ui/detail-fullpage-modal'
import {
  DetailModalSidebar,
  type DetailModalSidebarNavItem,
} from '@/shared/ui/detail-modal-sidebar'
import type {
  PaymentOrderAdminInstructorDetail,
  PaymentOrderAdminInstructorDetailProgramRow,
  PaymentOrderAdminInstructorRow,
  PaymentOrderAdminProcessingStatus,
  PaymentOrderAdminProgramDetail,
  PaymentOrderAdminProgramDetailInstructorRow,
  PaymentOrderAdminProgramRow,
  PaymentOrderProgramCalculationStatement,
} from '@/data/mock/payment-order-admin-list'
import { PaymentOrderDetailFilterTable } from '@/features/settlement/ui/payment-record/payment-order-detail-filter-table'
import { PaymentOrderProgramCalculationStatementModal } from '@/features/settlement/ui/payment-record/payment-order-program-calculation-statement-modal'
import { PaymentOrderInstructorBasicInfo } from '@/pages/settlement-management/payment-order-instructor-basic-info'
import { PaymentOrderProgramBasicInfo } from '@/pages/settlement-management/payment-order-program-basic-info'
import { PaymentOrderStatusDetailLnbIcon } from '@/pages/settlement-management/payment-order-status-detail-lnb-icon'
import '@/features/program/ui/detail-modal/program-status/program-status-participating-shared.css'
import '@/pages/settlement-management/payment-order-program-status-detail-fullpage-modal.css'
import '@/pages/settlement-management/payment-order-instructor-status-detail-fullpage-modal.css'

export type PaymentOrderCalculationStatementLineRow =
  | PaymentOrderAdminProgramDetailInstructorRow
  | PaymentOrderAdminInstructorDetailProgramRow

type PaymentOrderDetailViewShared = {
  isOpen: boolean
  lineAggregateStatus: PaymentOrderAdminProcessingStatus
  handleAggregateChange: (status: PaymentOrderAdminProcessingStatus) => void
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

type PaymentOrderDetailMainBasicInfoProps =
  | PaymentOrderProgramBasicInfoProps
  | PaymentOrderInstructorBasicInfoProps

const COMPONENT_MAP = {
  program: {
    BasicInfo: PaymentOrderProgramBasicInfo as ComponentType<PaymentOrderDetailMainBasicInfoProps>,
  },
  instructor: {
    BasicInfo: PaymentOrderInstructorBasicInfo as ComponentType<PaymentOrderDetailMainBasicInfoProps>,
  },
} as const

export function PaymentOrderDetailView(props: PaymentOrderDetailViewProps): ReactElement {
  const {
    isOpen,
    kind,
    title,
    modalClassName,
    detail,
    row,
    lineAggregateStatus,
    handleAggregateChange,
    calcStatementOpen,
    calcStatementData,
    openCalculationStatement,
    closeCalculationStatement,
    resetCalcAndClose,
  } = props

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

  const { BasicInfo } = COMPONENT_MAP[kind]

  const mainContent = (
    <>
      <BasicInfo
        {...({
          detail,
          aggregateStatus: lineAggregateStatus,
        } as PaymentOrderDetailMainBasicInfoProps)}
      />
      {kind === 'program' ? (
        <PaymentOrderDetailFilterTable
          mode="program"
          programRow={row}
          isOpen={isOpen}
          onAggregateChange={handleAggregateChange}
          onOpenCalculationStatement={openCalculationStatement}
        />
      ) : (
        <PaymentOrderDetailFilterTable
          mode="instructor"
          instructorRow={row}
          isOpen={isOpen}
          onAggregateChange={handleAggregateChange}
          onOpenCalculationStatement={openCalculationStatement}
        />
      )}
    </>
  )

  return (
    <>
      <PaymentOrderProgramCalculationStatementModal
        open={calcStatementOpen}
        onCancel={closeCalculationStatement}
        data={calcStatementData}
      />
      <DetailFullPageModal
        open={isOpen}
        onClose={resetCalcAndClose}
        title={title}
        className={modalClassName}
        sidebar={sidebar}
      >
        <div className="payment-order-program-status-detail__root">{mainContent}</div>
      </DetailFullPageModal>
    </>
  )
}
