/**
 * 지급 현황 상세 풀페이지 — 단일 모달·사이드바·산출 내역서 셸 + 본문
 */

import { useCallback, useMemo, type ReactElement } from 'react'
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
import { usePersonalInfoReveal } from '@/features/user/detail/lib/use-personal-info-reveal'
import { DetailFullPageModal } from '@/shared/ui/detail-fullpage-modal'
import {
  DetailModalSidebar,
  type DetailModalSidebarNavItem,
} from '@/shared/ui/detail-modal-sidebar'
import { PaymentOrderDetailFilterTable } from './payment-order-detail-filter-table'
import { PaymentOrderProgramCalculationStatementModal } from './payment-order-program-calculation-statement-modal'
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

  const resolvePersonalInfoAccessItem = useCallback(() => {
    const instructorDetail = detail as PaymentOrderAdminInstructorDetail
    return instructorDetail.nameKo ?? '지급 현황 상세 강사'
  }, [detail])

  const {
    personalInfoRevealed,
    onPrivacyControlClick: handlePrivacyToggleClick,
    confirmModal: personalInfoRevealModal,
  } = usePersonalInfoReveal({
    resolveAccessItem: resolvePersonalInfoAccessItem,
    resetDeps: [isOpen, kind, instructorRowKey],
    controlMode: 'toggleRemask',
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
        />
      ) : (
        <PaymentOrderDetailFilterTable
          mode="instructor"
          instructorRow={row}
          isOpen={isOpen}
          listPageDateRange={listPageDateRange}
          onAggregateChange={handleAggregateChange}
          onOpenCalculationStatement={openCalculationStatement}
        />
      )}
    </>
  )

  return (
    <>
      {kind === 'instructor' ? personalInfoRevealModal : null}
      <PaymentOrderProgramCalculationStatementModal
        open={calcStatementOpen}
        onCancel={closeCalculationStatement}
        data={calcStatementData}
      />
      <DetailFullPageModal
        open={isOpen}
        onClose={resetCalcAndClose}
        title={title}
        className={detailModalRootClass}
        sidebar={sidebar}
      >
        <div className="payment-order-program-status-detail__root">{mainContent}</div>
      </DetailFullPageModal>
    </>
  )
}
