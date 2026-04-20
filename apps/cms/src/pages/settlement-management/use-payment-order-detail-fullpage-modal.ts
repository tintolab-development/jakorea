/**
 * 지급 현황 상세 풀페이지 모달 — mock 상세·산출 내역서 상태
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Dayjs } from 'dayjs'
import {
  getMockPaymentOrderCalculationStatementFromInstructorDetailPage,
  getMockPaymentOrderCalculationStatementFromProgramDetailPage,
  getMockPaymentOrderInstructorDetail,
  getMockPaymentOrderProgramDetail,
  type PaymentOrderAdminInstructorDetailProgramRow,
  type PaymentOrderAdminInstructorRow,
  type PaymentOrderAdminProgramDetailInstructorRow,
  type PaymentOrderAdminProgramRow,
  type PaymentOrderProgramCalculationStatement,
} from '@/data/mock/payment-order-admin-list'
import type { PaymentOrderDetailAggregateStatus } from '@/shared/constants/payment-order-aggregate-status'

/** 컴포넌트 밖에 두어 `current` 참조가 렌더마다 바뀌지 않게 함 (useMemo/useCallback deps) */
const CONFIG = {
  program: {
    getDetail: getMockPaymentOrderProgramDetail,
    getCalc: getMockPaymentOrderCalculationStatementFromProgramDetailPage,
    getTitle: (detail: { programName: string }) => `지급 현황 상세_${detail.programName}`,
  },
  instructor: {
    getDetail: getMockPaymentOrderInstructorDetail,
    getCalc: getMockPaymentOrderCalculationStatementFromInstructorDetailPage,
    getTitle: (detail: { nameKo: string }) => `지급 현황 상세_${detail.nameKo}`,
  },
} as const

type CalcLineRow =
  | PaymentOrderAdminProgramDetailInstructorRow
  | PaymentOrderAdminInstructorDetailProgramRow

export type PaymentOrderDetailFullPageModalInput = {
  type: 'program' | 'instructor'
  isOpen: boolean
  onClose: () => void
  data: PaymentOrderAdminProgramRow | PaymentOrderAdminInstructorRow | null
  listPageDateRange: [Dayjs, Dayjs] | null
}

export function usePaymentOrderDetailFullPageModalState(input: PaymentOrderDetailFullPageModalInput) {
  const { type, isOpen, onClose, data, listPageDateRange } = input

  const row = data
  const current = CONFIG[type]

  const [lineAggregateStatus, setLineAggregateStatus] =
    useState<PaymentOrderDetailAggregateStatus>('na')
  const [calcStatementOpen, setCalcStatementOpen] = useState(false)
  const [calcStatementData, setCalcStatementData] =
    useState<PaymentOrderProgramCalculationStatement | null>(null)

  const handleAggregateChange = useCallback((status: PaymentOrderDetailAggregateStatus) => {
    setLineAggregateStatus(status)
  }, [])

  const detail = useMemo(() => {
    if (!row) return null
    return current.getDetail(row as never)
  }, [row, current])

  /* eslint-disable react-hooks/set-state-in-effect -- 모달 열림 시 산출·집계 상태 의도적 리셋 */
  useEffect(() => {
    if (isOpen) {
      setLineAggregateStatus('na')
      setCalcStatementOpen(false)
      setCalcStatementData(null)
    }
  }, [isOpen, type, row])
  /* eslint-enable react-hooks/set-state-in-effect */

  const openCalculationStatement = useCallback(
    (lineRow: CalcLineRow) => {
      if (!row || !detail) return

      setCalcStatementData(current.getCalc(row as never, detail as never, lineRow as never))
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

  return {
    canRender: Boolean(isOpen && row && detail),
    sharedViewProps,
    viewBranch:
      row && detail
        ? {
            kind: type,
            title: current.getTitle(detail as never),
            modalClassName: type === 'instructor' ? '' : undefined,
            detail,
            row,
            listPageDateRange,
          }
        : null,
  }
}
