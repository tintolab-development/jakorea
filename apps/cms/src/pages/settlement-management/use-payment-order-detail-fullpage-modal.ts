/**
 * 지급 현황 상세 풀페이지 모달 — mock / API 상세·산출 내역서 상태
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Dayjs } from 'dayjs'
import {
  buildInstructorDetailFromSettlements,
  buildProgramDetailFromSettlements,
} from '@/features/settlement-management/api/payment-orders/map-settlement-detail'
import {
  mapSettlementDetailToInstructorPageCalculationStatement,
  mapSettlementDetailToProgramCalculationStatement,
} from '@/features/settlement-management/api/payment-orders/map-settlement-detail-to-calculation-statement'
import { usePaymentOrdersDetailContextQuery } from '@/features/settlement-management/hooks/use-payment-orders-detail-query'
import { useSettlementDetailQuery } from '@/features/settlement-management/hooks/use-settlement-detail-query'
import { shouldUseSettlementRemote } from '@/features/settlement-management/hooks/use-settlement-remote-enabled'
import { isAwaitingFirstQueryData } from '@/shared/lib/is-awaiting-first-query-data'
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

const MOCK_CONFIG = {
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
  const paymentOrdersRemote = shouldUseSettlementRemote('paymentOrders')
  const aggregateKey = row?.aggregateKey ?? null

  const detailContextQuery = usePaymentOrdersDetailContextQuery(
    type,
    aggregateKey,
    isOpen && paymentOrdersRemote
  )

  const [lineAggregateStatus, setLineAggregateStatus] =
    useState<PaymentOrderDetailAggregateStatus>('na')
  const [calcStatementOpen, setCalcStatementOpen] = useState(false)
  const [calcLineRow, setCalcLineRow] = useState<CalcLineRow | null>(null)
  const [calcStatementData, setCalcStatementData] =
    useState<PaymentOrderProgramCalculationStatement | null>(null)

  const calcSettlementId = calcLineRow?.settlementId ?? null
  const settlementDetailQuery = useSettlementDetailQuery(
    calcSettlementId,
    calcStatementOpen && paymentOrdersRemote
  )

  const handleAggregateChange = useCallback((status: PaymentOrderDetailAggregateStatus) => {
    setLineAggregateStatus(status)
  }, [])

  const mockDetail = useMemo(() => {
    if (!row || paymentOrdersRemote) return null
    return MOCK_CONFIG[type].getDetail(row as never)
  }, [row, paymentOrdersRemote, type])

  const remoteProgramDetail = useMemo(() => {
    if (!paymentOrdersRemote || type !== 'program' || !row || !detailContextQuery.data) return null
    return buildProgramDetailFromSettlements(
      row as PaymentOrderAdminProgramRow,
      detailContextQuery.data.items ?? [],
      detailContextQuery.data.statements ?? []
    )
  }, [paymentOrdersRemote, type, row, detailContextQuery.data])

  const remoteInstructorDetail = useMemo(() => {
    if (!paymentOrdersRemote || type !== 'instructor' || !row || !detailContextQuery.data) return null
    return buildInstructorDetailFromSettlements(
      row as PaymentOrderAdminInstructorRow,
      detailContextQuery.data.items ?? [],
      detailContextQuery.data.statements ?? []
    )
  }, [paymentOrdersRemote, type, row, detailContextQuery.data])

  const detail = paymentOrdersRemote
    ? type === 'program'
      ? remoteProgramDetail
      : remoteInstructorDetail
    : mockDetail

  /* eslint-disable react-hooks/set-state-in-effect -- 모달 열림 시 산출·집계 상태 의도적 리셋 */
  useEffect(() => {
    if (isOpen) {
      setLineAggregateStatus('na')
      setCalcStatementOpen(false)
      setCalcLineRow(null)
      setCalcStatementData(null)
    }
  }, [isOpen, type, row])
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!paymentOrdersRemote || !calcStatementOpen || !calcLineRow || !row || !detail) {
      return
    }
    if (!settlementDetailQuery.data) return

    if (type === 'program' && 'programName' in detail) {
      setCalcStatementData(
        mapSettlementDetailToProgramCalculationStatement(
          calcLineRow as PaymentOrderAdminProgramDetailInstructorRow,
          settlementDetailQuery.data,
          detail.programName
        )
      )
      return
    }

    if (type === 'instructor' && 'nameKo' in detail) {
      setCalcStatementData(
        mapSettlementDetailToInstructorPageCalculationStatement(
          calcLineRow as PaymentOrderAdminInstructorDetailProgramRow,
          settlementDetailQuery.data,
          detail.nameKo
        )
      )
    }
  }, [
    paymentOrdersRemote,
    calcStatementOpen,
    calcLineRow,
    row,
    detail,
    type,
    settlementDetailQuery.data,
  ])

  const openCalculationStatement = useCallback(
    (lineRow: CalcLineRow) => {
      if (!row || !detail) return

      if (paymentOrdersRemote) {
        if (lineRow.settlementId == null) {
          window.alert('산출 내역서 API에 필요한 settlementId가 없습니다.')
          return
        }
        setCalcLineRow(lineRow)
        setCalcStatementData(null)
        setCalcStatementOpen(true)
        return
      }

      const current = MOCK_CONFIG[type]
      setCalcLineRow(lineRow)
      setCalcStatementData(current.getCalc(row as never, detail as never, lineRow as never))
      setCalcStatementOpen(true)
    },
    [row, detail, paymentOrdersRemote, type]
  )

  const closeCalculationStatement = useCallback(() => {
    setCalcStatementOpen(false)
    setCalcLineRow(null)
    setCalcStatementData(null)
  }, [])

  const resetCalcAndClose = useCallback(() => {
    setCalcStatementOpen(false)
    setCalcLineRow(null)
    setCalcStatementData(null)
    onClose()
  }, [onClose])

  const title = useMemo(() => {
    if (!detail) return ''
    if (type === 'program' && 'programName' in detail) {
      return `지급 현황 상세_${detail.programName}`
    }
    if (type === 'instructor' && 'nameKo' in detail) {
      return `지급 현황 상세_${detail.nameKo}`
    }
    return '지급 현황 상세'
  }, [detail, type])

  const calcStatementLoading =
    paymentOrdersRemote &&
    calcStatementOpen &&
    (settlementDetailQuery.isLoading || (settlementDetailQuery.isSuccess && !calcStatementData))

  const sharedViewProps = {
    isOpen,
    lineAggregateStatus,
    handleAggregateChange,
    calcStatementOpen,
    calcStatementData,
    calcStatementLoading,
    calcStatementError: paymentOrdersRemote ? settlementDetailQuery.error : null,
    calcStatementId: calcLineRow?.statementId ?? null,
    openCalculationStatement,
    closeCalculationStatement,
    resetCalcAndClose,
    paymentOrdersRemote,
    detailContextQuery,
  }

  const detailLoading =
    paymentOrdersRemote && isOpen && Boolean(aggregateKey) && isAwaitingFirstQueryData(detailContextQuery)

  return {
    canRender: Boolean(isOpen && row && detail && !detailLoading),
    detailLoading,
    detailError: paymentOrdersRemote ? detailContextQuery.error : null,
    sharedViewProps,
    viewBranch:
      row && detail
        ? {
            kind: type,
            title,
            modalClassName: type === 'instructor' ? '' : undefined,
            detail,
            row,
            listPageDateRange,
          }
        : null,
  }
}
