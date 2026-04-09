/**
 * 정산 관리 > 지급조서 확인 — 지급 현황 상세 풀페이지 모달 (프로그램·강사 공통 셸)
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  getMockPaymentOrderCalculationStatementFromInstructorDetailPage,
  getMockPaymentOrderCalculationStatementFromProgramDetailPage,
  getMockPaymentOrderInstructorDetail,
  getMockPaymentOrderProgramDetail,
  type PaymentOrderAdminInstructorRow,
  type PaymentOrderAdminProcessingStatus,
  type PaymentOrderAdminProgramRow,
  type PaymentOrderProgramCalculationStatement,
} from '@/data/mock/payment-order-admin-list'
import {
  PaymentOrderDetailView,
  type PaymentOrderCalculationStatementLineRow,
  type PaymentOrderDetailViewProps,
} from '@/features/settlement/ui/payment-record'

/** 컴포넌트 밖에 두어 `current` 참조가 렌더마다 바뀌지 않게 함 (useMemo/useCallback deps) */
const CONFIG = {
  program: {
    getDetail: getMockPaymentOrderProgramDetail,
    getCalc: getMockPaymentOrderCalculationStatementFromProgramDetailPage,
    getTitle: (detail: any) => `지급 현황 상세_${detail.programName}`,
  },
  instructor: {
    getDetail: getMockPaymentOrderInstructorDetail,
    getCalc: getMockPaymentOrderCalculationStatementFromInstructorDetailPage,
    getTitle: (detail: any) => `지급 현황 상세_${detail.nameKo}`,
  },
} as const

export type PaymentOrderDetailFullPageModalProps = {
  type: 'program' | 'instructor'
  isOpen: boolean
  onClose: () => void
  /** 열림 + type 일치 시 해당 행. 닫힌 상태에서는 null 권장 */
  data: PaymentOrderAdminProgramRow | PaymentOrderAdminInstructorRow | null
}

export function PaymentOrderDetailFullPageModal(props: PaymentOrderDetailFullPageModalProps) {
  const { type, isOpen, onClose, data } = props

  const row = data
  const current = CONFIG[type]

  const [lineAggregateStatus, setLineAggregateStatus] =
    useState<PaymentOrderAdminProcessingStatus>('pending')
  const [calcStatementOpen, setCalcStatementOpen] = useState(false)
  const [calcStatementData, setCalcStatementData] =
    useState<PaymentOrderProgramCalculationStatement | null>(null)

  const handleAggregateChange = useCallback((status: PaymentOrderAdminProcessingStatus) => {
    setLineAggregateStatus(status)
  }, [])

  const detail = useMemo(() => {
    if (!row) return null
    return current.getDetail(row as any)
  }, [row, current])

  useEffect(() => {
    if (isOpen) {
      setLineAggregateStatus('pending')
      setCalcStatementOpen(false)
      setCalcStatementData(null)
    }
  }, [isOpen, type, row])

  const openCalculationStatement = useCallback(
    (lineRow: PaymentOrderCalculationStatementLineRow) => {
      if (!row || !detail) return

      setCalcStatementData(current.getCalc(row as any, detail as any, lineRow as any))
      setCalcStatementOpen(true)
    },
    [row, detail, current]
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

  if (!isOpen || !row || !detail) {
    return null
  }

  return (
    <PaymentOrderDetailView
      {...({
        ...sharedViewProps,
        kind: type,
        title: current.getTitle(detail),
        modalClassName: type === 'instructor' ? '' : undefined,
        detail,
        row,
      } as PaymentOrderDetailViewProps)}
    />
  )
}
