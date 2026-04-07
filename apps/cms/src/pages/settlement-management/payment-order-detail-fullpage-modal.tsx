/**
 * 정산 관리 > 지급조서 확인 — 지급 현황 상세 풀페이지 모달 (프로그램·강사 공통 셸)
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  getMockPaymentOrderCalculationStatementFromInstructorDetailPage,
  getMockPaymentOrderCalculationStatementFromProgramDetailPage,
  getMockPaymentOrderInstructorDetail,
  getMockPaymentOrderProgramDetail,
  type PaymentOrderAdminInstructorDetailProgramRow,
  type PaymentOrderAdminInstructorRow,
  type PaymentOrderAdminProcessingStatus,
  type PaymentOrderAdminProgramDetailInstructorRow,
  type PaymentOrderAdminProgramRow,
  type PaymentOrderProgramCalculationStatement,
} from '@/data/mock/payment-order-admin-list'
import {
  PaymentOrderDetailView,
  type PaymentOrderCalculationStatementLineRow,
} from '@/features/settlement/ui/payment-record'

export type PaymentOrderDetailFullPageModalProps = {
  type: 'program' | 'instructor'
  isOpen: boolean
  onClose: () => void
  /** 열림 + type 일치 시 해당 행. 닫힌 상태에서는 null 권장 */
  data: PaymentOrderAdminProgramRow | PaymentOrderAdminInstructorRow | null
}

export function PaymentOrderDetailFullPageModal(props: PaymentOrderDetailFullPageModalProps) {
  const { type, isOpen, onClose, data } = props

  const [lineAggregateStatus, setLineAggregateStatus] =
    useState<PaymentOrderAdminProcessingStatus>('pending')
  const [calcStatementOpen, setCalcStatementOpen] = useState(false)
  const [calcStatementData, setCalcStatementData] =
    useState<PaymentOrderProgramCalculationStatement | null>(null)

  const handleAggregateChange = useCallback((status: PaymentOrderAdminProcessingStatus) => {
    setLineAggregateStatus(status)
  }, [])

  const programRow: PaymentOrderAdminProgramRow | null =
    type === 'program' && data != null ? (data as PaymentOrderAdminProgramRow) : null
  const instructorRow: PaymentOrderAdminInstructorRow | null =
    type === 'instructor' && data != null ? (data as PaymentOrderAdminInstructorRow) : null

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
    }
  }, [isOpen, type, programRow?.no, instructorRow?.no])

  const openCalculationStatement = useCallback(
    (lineRow: PaymentOrderCalculationStatementLineRow) => {
      if (type === 'program' && programRow && programDetail) {
        setCalcStatementData(
          getMockPaymentOrderCalculationStatementFromProgramDetailPage(
            programRow,
            programDetail,
            lineRow as PaymentOrderAdminProgramDetailInstructorRow
          )
        )
        setCalcStatementOpen(true)
        return
      }
      if (type === 'instructor' && instructorRow && instructorDetail) {
        setCalcStatementData(
          getMockPaymentOrderCalculationStatementFromInstructorDetailPage(
            instructorRow,
            instructorDetail,
            lineRow as PaymentOrderAdminInstructorDetailProgramRow
          )
        )
        setCalcStatementOpen(true)
      }
    },
    [type, programRow, programDetail, instructorRow, instructorDetail]
  )

  const closeCalculationStatement = useCallback(() => {
    setCalcStatementOpen(false)
    setCalcStatementData(null)
  }, [])

  const resetCalcAndClose = useCallback(() => {
    setCalcStatementOpen(false)
    setCalcStatementData(null)
    onClose()
  }, [onClose])

  const sharedViewProps = {
    isOpen,
    lineAggregateStatus,
    handleAggregateChange,
    calcStatementOpen,
    calcStatementData,
    openCalculationStatement,
    closeCalculationStatement,
    resetCalcAndClose,
  }

  if (!isOpen || data == null) {
    return null
  }

  if (type === 'program' && programRow && programDetail) {
    return (
      <PaymentOrderDetailView
        {...sharedViewProps}
        kind="program"
        title={`지급 현황 상세_${programDetail.programName}`}
        modalClassName={undefined}
        detail={programDetail}
        row={programRow}
      />
    )
  }

  if (type === 'instructor' && instructorRow && instructorDetail) {
    return (
      <PaymentOrderDetailView
        {...sharedViewProps}
        kind="instructor"
        title={`지급 현황 상세_${instructorDetail.nameKo}`}
        modalClassName=""
        detail={instructorDetail}
        row={instructorRow}
      />
    )
  }

  return null
}
