/**
 * 정산 관리 > 지급조서 확인 — 지급 현황 상세 풀페이지 모달 (프로그램·강사 공통 셸)
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { DetailFullPageModal } from '@/shared/ui/detail-fullpage-modal'
import {
  DetailModalSidebar,
  type DetailModalSidebarNavItem,
} from '@/shared/ui/detail-modal-sidebar'
import {
  getMockPaymentOrderCalculationStatementFromInstructorDetailPage,
  getMockPaymentOrderCalculationStatementFromProgramDetailPage,
  getMockPaymentOrderInstructorDetail,
  getMockPaymentOrderProgramDetail,
  type PaymentOrderAdminInstructorRow,
  type PaymentOrderAdminProcessingStatus,
  type PaymentOrderAdminProgramDetailInstructorRow,
  type PaymentOrderAdminProgramRow,
  type PaymentOrderAdminInstructorDetailProgramRow,
  type PaymentOrderProgramCalculationStatement,
} from '@/data/mock/payment-order-admin-list'
import '@/features/program/ui/detail-modal/program-status/program-status-participating-shared.css'
import { PaymentOrderStatusDetailLnbIcon } from './payment-order-status-detail-lnb-icon'
import { PaymentOrderProgramCalculationStatementModal } from './payment-order-program-calculation-statement-modal'
import { PaymentOrderProgramBasicInfo } from './payment-order-program-basic-info'
import { PaymentOrderInstructorBasicInfo } from './payment-order-instructor-basic-info'
import { PaymentOrderProgramSettlementTable } from './payment-order-program-settlement-table'
import { PaymentOrderInstructorSettlementTable } from './payment-order-instructor-settlement-table'
import './payment-order-program-status-detail-fullpage-modal.css'
import './payment-order-instructor-status-detail-fullpage-modal.css'
import type { PaymentOrderCalculationStatementCommitPayload } from './payment-order-detail-fullpage-shared'

export type PaymentOrderDetailFullPageModalProps =
  | {
      type: 'program'
      isOpen: boolean
      onClose: () => void
      data: PaymentOrderAdminProgramRow | null
    }
  | {
      type: 'instructor'
      isOpen: boolean
      onClose: () => void
      data: PaymentOrderAdminInstructorRow | null
    }

export function PaymentOrderDetailFullPageModal(props: PaymentOrderDetailFullPageModalProps) {
  const { isOpen, onClose, type } = props

  const [lineAggregateStatus, setLineAggregateStatus] =
    useState<PaymentOrderAdminProcessingStatus>('pending')
  const [calcStatementOpen, setCalcStatementOpen] = useState(false)
  const [calcStatementData, setCalcStatementData] =
    useState<PaymentOrderProgramCalculationStatement | null>(null)
  const [calcLineCommit, setCalcLineCommit] =
    useState<PaymentOrderCalculationStatementCommitPayload | null>(null)

  const handleAggregateChange = useCallback((status: PaymentOrderAdminProcessingStatus) => {
    setLineAggregateStatus(status)
  }, [])

  const programRow = type === 'program' ? props.data : null
  const instructorRow = type === 'instructor' ? props.data : null

  const programDetail = useMemo(
    () => (programRow ? getMockPaymentOrderProgramDetail(programRow) : null),
    [programRow]
  )

  const instructorDetail = useMemo(
    () => (instructorRow ? getMockPaymentOrderInstructorDetail(instructorRow) : null),
    [instructorRow]
  )

  useEffect(() => {
    if (isOpen) {
      setLineAggregateStatus('pending')
      setCalcStatementOpen(false)
      setCalcStatementData(null)
      setCalcLineCommit(null)
    }
  }, [isOpen, type, programRow?.no, instructorRow?.no])

  const openProgramCalculationStatement = useCallback(
    (row: PaymentOrderAdminProgramDetailInstructorRow) => {
      if (!programRow || !programDetail) return
      setCalcStatementData(
        getMockPaymentOrderCalculationStatementFromProgramDetailPage(programRow, programDetail, row)
      )
      setCalcStatementOpen(true)
    },
    [programDetail, programRow]
  )

  const openInstructorCalculationStatement = useCallback(
    (row: PaymentOrderAdminInstructorDetailProgramRow) => {
      if (!instructorRow || !instructorDetail) return
      setCalcStatementData(
        getMockPaymentOrderCalculationStatementFromInstructorDetailPage(
          instructorRow,
          instructorDetail,
          row
        )
      )
      setCalcStatementOpen(true)
    },
    [instructorDetail, instructorRow]
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

  const resetCalcAndClose = useCallback(() => {
    setCalcStatementOpen(false)
    setCalcStatementData(null)
    onClose()
  }, [onClose])

  if (!isOpen || !props.data) {
    return null
  }

  if (type === 'program') {
    if (!programRow || !programDetail) return null
    return (
      <>
        <PaymentOrderProgramCalculationStatementModal
          open={calcStatementOpen}
          onCancel={() => {
            setCalcStatementOpen(false)
            setCalcStatementData(null)
          }}
          data={calcStatementData}
          onProcessingCommitted={setCalcLineCommit}
          onCloseStatementSheet={() => setCalcStatementOpen(false)}
          onClearCalculationStatementData={() => setCalcStatementData(null)}
        />
        <DetailFullPageModal
          open={isOpen}
          onClose={resetCalcAndClose}
          title={`지급 현황 상세_${programDetail.programName}`}
          className="payment-order-program-status-detail-fullpage-modal"
          sidebar={
            <DetailModalSidebar
              navAriaLabel="지급 현황 상세 메뉴"
              items={sidebarItems}
              activeKey="payment-status-detail"
              activeChildKey=""
              expandedGroupKeys={[]}
              onSelectTop={() => {}}
              onSelectChild={() => {}}
            />
          }
        >
          <div className="payment-order-program-status-detail__root participating-institutions-section">
            <PaymentOrderProgramBasicInfo
              detail={programDetail}
              aggregateStatus={lineAggregateStatus}
            />
            <PaymentOrderProgramSettlementTable
              programRow={programRow}
              isOpen={isOpen}
              onAggregateChange={handleAggregateChange}
              onOpenCalculationStatement={openProgramCalculationStatement}
              calculationCommit={calcLineCommit}
              onCalculationCommitApplied={() => setCalcLineCommit(null)}
            />
          </div>
        </DetailFullPageModal>
      </>
    )
  }

  if (!instructorRow || !instructorDetail) return null

  return (
    <>
      <PaymentOrderProgramCalculationStatementModal
        open={calcStatementOpen}
        onCancel={() => {
          setCalcStatementOpen(false)
          setCalcStatementData(null)
        }}
        data={calcStatementData}
        onProcessingCommitted={setCalcLineCommit}
        onCloseStatementSheet={() => setCalcStatementOpen(false)}
        onClearCalculationStatementData={() => setCalcStatementData(null)}
      />
      <DetailFullPageModal
        open={isOpen}
        onClose={resetCalcAndClose}
        title={`지급 현황 상세_${instructorDetail.nameKo}`}
        className="payment-order-instructor-status-detail-fullpage-modal"
        sidebar={
          <DetailModalSidebar
            navAriaLabel="지급 현황 상세 메뉴"
            items={sidebarItems}
            activeKey="payment-status-detail"
            activeChildKey=""
            expandedGroupKeys={[]}
            onSelectTop={() => {}}
            onSelectChild={() => {}}
          />
        }
      >
        <div className="payment-order-program-status-detail__root participating-institutions-section">
          <PaymentOrderInstructorBasicInfo
            detail={instructorDetail}
            aggregateStatus={lineAggregateStatus}
          />
          <PaymentOrderInstructorSettlementTable
            instructorRow={instructorRow}
            isOpen={isOpen}
            onAggregateChange={handleAggregateChange}
            onOpenCalculationStatement={openInstructorCalculationStatement}
            calculationCommit={calcLineCommit}
            onCalculationCommitApplied={() => setCalcLineCommit(null)}
          />
        </div>
      </DetailFullPageModal>
    </>
  )
}
