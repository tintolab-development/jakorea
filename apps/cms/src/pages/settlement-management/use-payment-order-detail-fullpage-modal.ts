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
  instructorIdentityFromLine,
  mapSettlementDetailToInstructorPageCalculationStatement,
  mapSettlementDetailToProgramCalculationStatement,
} from '@/features/settlement-management/api/payment-orders/map-settlement-detail-to-calculation-statement'
import { mapCalculationDetailToBasisDetail } from '@/features/settlement-management/api/shared/map-frontend-fields'
import { mapTransportationSnapshotToBasisDetail } from '@/features/settlement/ui/payment-record/payment-order-calculation-basis-detail'
import { usePaymentOrdersDetailContextQuery } from '@/features/settlement-management/hooks/use-payment-orders-detail-query'
import { useSettlementDetailQuery } from '@/features/settlement-management/hooks/use-settlement-detail-query'
import { useSettlementTransportationSnapshotQuery } from '@/features/settlement-management/hooks/use-settlement-transportation-snapshot-query'
import { shouldUseSettlementRemote } from '@/features/settlement-management/hooks/use-settlement-remote-enabled'
import { useCmsAlert } from '@/shared/ui'
import { isAwaitingFirstQueryData } from '@/shared/lib/is-awaiting-first-query-data'
import type {
  PaymentOrderAdminInstructorDetailProgramRow,
  PaymentOrderAdminInstructorRow,
  PaymentOrderAdminProgramDetailInstructorRow,
  PaymentOrderAdminProgramRow,
  PaymentOrderProgramCalculationStatement,
} from '@/features/settlement-management/model/payment-order-admin-list'
import type { PaymentOrderDetailAggregateStatus } from '@/shared/constants/payment-order-aggregate-status'

type CalcLineRow =
  | PaymentOrderAdminProgramDetailInstructorRow
  | PaymentOrderAdminInstructorDetailProgramRow

export type PaymentOrderDetailFullPageModalInput = {
  type: 'program' | 'instructor'
  isOpen: boolean
  onClose: () => void
  data: PaymentOrderAdminProgramRow | PaymentOrderAdminInstructorRow | null
  listPageDateRange: [Dayjs | null, Dayjs | null] | null
}

export function usePaymentOrderDetailFullPageModalState(
  input: PaymentOrderDetailFullPageModalInput
) {
  const { type, isOpen, onClose, data, listPageDateRange } = input
  const { showAlert } = useCmsAlert()

  const row = data
  const paymentOrdersRemote = shouldUseSettlementRemote('paymentOrders')
  const aggregateKey = row?.aggregateKey ?? null

  const detailContextQuery = usePaymentOrdersDetailContextQuery(
    type,
    aggregateKey,
    listPageDateRange,
    isOpen && paymentOrdersRemote
  )

  const [lineAggregateStatus, setLineAggregateStatus] =
    useState<PaymentOrderDetailAggregateStatus>('na')
  const [lineCountableAmount, setLineCountableAmount] = useState<number | null>(null)
  const [calcStatementOpen, setCalcStatementOpen] = useState(false)
  const [calcLineRow, setCalcLineRow] = useState<CalcLineRow | null>(null)
  const [calcStatementData, setCalcStatementData] =
    useState<PaymentOrderProgramCalculationStatement | null>(null)

  const calcSettlementId = calcLineRow?.settlementId ?? null
  const settlementDetailQuery = useSettlementDetailQuery(
    calcSettlementId,
    calcStatementOpen && paymentOrdersRemote
  )

  const shouldFetchTransportationSnapshot = useMemo(() => {
    if (!calcStatementOpen || !paymentOrdersRemote || calcSettlementId == null) return false
    return (settlementDetailQuery.data?.items ?? []).some(item => {
      if (item.type !== 'transportation') return false
      return mapCalculationDetailToBasisDetail(item.calculationDetail)?.layout !== 'transportSnapshot'
    })
  }, [
    calcSettlementId,
    calcStatementOpen,
    paymentOrdersRemote,
    settlementDetailQuery.data?.items,
  ])

  const transportationSnapshotQuery = useSettlementTransportationSnapshotQuery(
    calcSettlementId,
    shouldFetchTransportationSnapshot
  )

  const handleAggregateChange = useCallback((status: PaymentOrderDetailAggregateStatus) => {
    setLineAggregateStatus(status)
  }, [])

  const handleCountableAmountChange = useCallback((amount: number) => {
    setLineCountableAmount(amount)
  }, [])

  const remoteProgramDetail = useMemo(() => {
    if (!paymentOrdersRemote || type !== 'program' || !row || !detailContextQuery.data) return null
    return buildProgramDetailFromSettlements(
      row as PaymentOrderAdminProgramRow,
      detailContextQuery.data.items ?? [],
      detailContextQuery.data.statements ?? []
    )
  }, [paymentOrdersRemote, type, row, detailContextQuery.data])

  const remoteInstructorDetail = useMemo(() => {
    if (!paymentOrdersRemote || type !== 'instructor' || !row || !detailContextQuery.data)
      return null
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
    : null

  /* eslint-disable react-hooks/set-state-in-effect -- 모달 열림 시 산출·집계 상태 의도적 리셋 */
  useEffect(() => {
    if (isOpen) {
      setLineAggregateStatus('na')
      setLineCountableAmount(null)
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
    if (shouldFetchTransportationSnapshot && !transportationSnapshotQuery.isFetched) return
    const transportationSnapshot = transportationSnapshotQuery.data?.find(snapshot => {
      if (snapshot.settlementId != null && snapshot.settlementId !== calcSettlementId) {
        return false
      }
      return mapTransportationSnapshotToBasisDetail(snapshot) != null
    })

    switch (type) {
      case 'program': {
        if (!('programName' in detail)) return
        const line = calcLineRow as PaymentOrderAdminProgramDetailInstructorRow
        setCalcStatementData(
          mapSettlementDetailToInstructorPageCalculationStatement(
            line,
            settlementDetailQuery.data,
            instructorIdentityFromLine(line.instructorName),
            detail.programName,
            transportationSnapshot
          )
        )
        break
      }
      case 'instructor': {
        if (!('nameKo' in detail)) return
        const line = calcLineRow as PaymentOrderAdminInstructorDetailProgramRow
        setCalcStatementData(
          mapSettlementDetailToProgramCalculationStatement(
            line,
            settlementDetailQuery.data,
            line.programName,
            detail.nameKo,
            transportationSnapshot
          )
        )
        break
      }
      default:
        break
    }
  }, [
    paymentOrdersRemote,
    calcStatementOpen,
    calcLineRow,
    row,
    detail,
    type,
    calcSettlementId,
    shouldFetchTransportationSnapshot,
    settlementDetailQuery.data,
    transportationSnapshotQuery.data,
    transportationSnapshotQuery.isFetched,
  ])

  const openCalculationStatement = useCallback(
    (lineRow: CalcLineRow) => {
      if (!row || !detail) return

      if (paymentOrdersRemote) {
        if (lineRow.settlementId == null) {
          showAlert({
            title: '안내',
            content: '산출 내역서 API에 필요한 settlementId가 없습니다.',
          })
          return
        }
        setCalcLineRow(lineRow)
        setCalcStatementData(null)
        setCalcStatementOpen(true)
        return
      }

      void row
      void lineRow
    },
    [row, detail, paymentOrdersRemote, type, showAlert]
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
    if (type === 'program' && row && 'programName' in row) {
      return `지급 현황 상세 (${row.programName})`
    }
    if (type === 'instructor' && row && 'instructorName' in row) {
      return `지급 현황 상세 (${row.instructorName})`
    }
    return '지급 현황 상세'
  }, [row, type])

  const calcStatementLoading =
    paymentOrdersRemote &&
    calcStatementOpen &&
    (settlementDetailQuery.isLoading ||
      (shouldFetchTransportationSnapshot && transportationSnapshotQuery.isLoading) ||
      (settlementDetailQuery.isSuccess && !calcStatementData))

  const sharedViewProps = {
    isOpen,
    lineAggregateStatus,
    handleAggregateChange,
    lineCountableAmount,
    handleCountableAmountChange,
    calcStatementOpen,
    calcStatementData,
    calcStatementLoading,
    calcStatementError: paymentOrdersRemote ? settlementDetailQuery.error : null,
    calcStatementId: calcLineRow?.statementId ?? null,
    calcSettlementId: calcLineRow?.settlementId ?? null,
    calcAvailableActions: settlementDetailQuery.data?.availableActions,
    openCalculationStatement,
    closeCalculationStatement,
    resetCalcAndClose,
    paymentOrdersRemote,
    detailContextQuery,
  }

  const detailLoading =
    paymentOrdersRemote &&
    isOpen &&
    Boolean(aggregateKey) &&
    isAwaitingFirstQueryData(detailContextQuery)

  return {
    detailLoading,
    detailError: paymentOrdersRemote ? detailContextQuery.error : null,
    sharedViewProps,
    viewBranch: row
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
