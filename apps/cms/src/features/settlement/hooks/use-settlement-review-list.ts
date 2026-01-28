/**
 * 정산 검토 목록 Hook
 * Phase 0.4.2: 관리자 정산 검토
 */

import { useMemo } from 'react'
import { useSettlementStore } from '../model/settlement-store'
import type { Settlement } from '@/types/domain'

interface UseSettlementReviewListOptions {
  settlements: Settlement[]
  onView: (settlement: Settlement) => void
  onApprove: (settlement: Settlement) => Promise<void>
  onReject: (settlement: Settlement) => Promise<void>
}

export function useSettlementReviewList({
  settlements,
  onView,
  onApprove,
  onReject,
}: UseSettlementReviewListOptions) {
  const { updateStatus } = useSettlementStore()

  // 검토 대상 정산 목록 (pending, calculated, review 상태)
  const reviewSettlements = useMemo(() => {
    return settlements.filter(s => 
      s.status === 'pending' || 
      s.status === 'calculated' || 
      s.status === 'review'
    )
  }, [settlements])

  const handleView = (settlement: Settlement) => {
    onView(settlement)
  }

  const handleApprove = async (settlement: Settlement) => {
    if (settlement.status === 'review') {
      await updateStatus(settlement.id, 'approved')
    } else if (settlement.status === 'calculated') {
      // 산출 완료 -> 검토 -> 승인
      await updateStatus(settlement.id, 'review')
      await updateStatus(settlement.id, 'approved')
    } else {
      // pending -> calculated -> review -> approved
      await updateStatus(settlement.id, 'calculated')
      await updateStatus(settlement.id, 'review')
      await updateStatus(settlement.id, 'approved')
    }
    await onApprove(settlement)
  }

  const handleReject = async (settlement: Settlement) => {
    await updateStatus(settlement.id, 'cancelled')
    await onReject(settlement)
  }

  return {
    reviewSettlements,
    handleView,
    handleApprove,
    handleReject,
  }
}
