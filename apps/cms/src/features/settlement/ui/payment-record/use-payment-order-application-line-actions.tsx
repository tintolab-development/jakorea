/**
 * 지급조서 확인 — 확정 전 정산 신청서 행의 승인·반려.
 * 신청서 승인만 호출하고, 지급조서 확인(예정일)은 호출하지 않는다.
 */
import { useCallback, useState, type ReactNode } from 'react'
import {
  confirmSettlementApplicationRemote,
  rejectSettlementApplicationRemote,
  SETTLEMENT_APPLICATION_ACTIONS,
} from '@/features/program/general/api/settlement-application-actions-remote'
import { SettlementApplicationReasonModal } from '@/features/program/general/ui/detail-modal/program-status/settlement-application-reason-modal'
import { isSettlementApplicationListItem } from '@/features/settlement-management/api/payment-orders/map-settlement-detail'
import { getSettlementApiErrorMessage } from '@/features/settlement-management/api/get-settlement-api-error'
import type { PaymentOrdersDetailContextQueryResult } from '@/features/settlement-management/hooks/use-payment-orders-detail-query'
import type {
  PaymentOrderAdminInstructorDetailProgramRow,
  PaymentOrderAdminProgramDetailInstructorRow,
} from '@/features/settlement-management/model/payment-order-admin-list'

type PaymentOrderApplicationLine =
  | PaymentOrderAdminProgramDetailInstructorRow
  | PaymentOrderAdminInstructorDetailProgramRow
import { ConfirmModal, useCmsAlert } from '@/shared/ui'
import {
  getApiErrorHttpStatus,
  networkAwareAlertTitle,
} from '@/shared/lib/extract-api-error-message'

const APPLICATION_ACTION_MODAL_Z_INDEX = 1300

export function usePaymentOrderApplicationLineActions(input: {
  line: PaymentOrderApplicationLine | null
  detailContextQuery?: PaymentOrdersDetailContextQueryResult
  onDone: () => void
}) {
  const { showAlert } = useCmsAlert()
  const { line, detailContextQuery, onDone } = input
  const isApplicationLine = line != null && isSettlementApplicationListItem(line)
  const applicationId = isApplicationLine ? (line.settlementApplicationId ?? null) : null
  const actions = line?.availableActions ?? []
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [reasonOpen, setReasonOpen] = useState(false)
  const [pending, setPending] = useState(false)

  const refetchList = useCallback(async () => {
    await detailContextQuery?.refetch()
  }, [detailContextQuery])

  const fail = useCallback(
    async (error: unknown) => {
      if (getApiErrorHttpStatus(error) === 409) await refetchList()
      showAlert({
        title: networkAwareAlertTitle(error, '안내'),
        content: getSettlementApiErrorMessage(error, '정산 신청서를 처리하지 못했습니다.'),
      })
    },
    [refetchList, showAlert]
  )

  const submitConfirm = useCallback(async () => {
    if (applicationId == null || pending) return
    setPending(true)
    try {
      await confirmSettlementApplicationRemote(applicationId, {})
      setConfirmOpen(false)
      await refetchList()
      onDone()
    } catch (error) {
      await fail(error)
    } finally {
      setPending(false)
    }
  }, [applicationId, fail, onDone, pending, refetchList])

  const submitReason = useCallback(
    async (reason: string) => {
      if (applicationId == null || !reasonOpen || pending) return
      setPending(true)
      try {
        await rejectSettlementApplicationRemote(applicationId, { reason })
        setReasonOpen(false)
        await refetchList()
        onDone()
      } catch (error) {
        await fail(error)
      } finally {
        setPending(false)
      }
    },
    [applicationId, fail, onDone, pending, reasonOpen, refetchList]
  )

  const statementActionOverride = isApplicationLine
    ? {
        onConfirm: async () => {
          setConfirmOpen(true)
        },
        onRejectClick: () => setReasonOpen(true),
        pending,
        confirmEnabled: actions.includes(SETTLEMENT_APPLICATION_ACTIONS.confirm),
        rejectEnabled: actions.includes(SETTLEMENT_APPLICATION_ACTIONS.reject),
        confirmWithoutScheduledDate: true,
      }
    : undefined

  const modals: ReactNode = isApplicationLine ? (
    <>
      <ConfirmModal
        open={confirmOpen}
        title="정산 신청서 승인"
        content="선택한 정산 신청서를 승인하시겠습니까?"
        confirmText="승인"
        cancelText="취소"
        onConfirm={() => void submitConfirm()}
        onCancel={() => {
          if (pending) return
          setConfirmOpen(false)
        }}
        confirmLoading={pending}
        zIndex={APPLICATION_ACTION_MODAL_Z_INDEX}
      />
      <SettlementApplicationReasonModal
        kind="reject"
        open={reasonOpen}
        confirming={pending}
        onCancel={() => {
          if (pending) return
          setReasonOpen(false)
        }}
        onConfirm={reason => submitReason(reason)}
        zIndex={APPLICATION_ACTION_MODAL_Z_INDEX}
      />
    </>
  ) : null

  return { statementActionOverride, modals }
}
