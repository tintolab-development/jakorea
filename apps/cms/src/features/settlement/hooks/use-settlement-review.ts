/**
 * 정산 검토 Hook
 * Phase 0.4.2: 관리자 정산 검토 - 승인/반려 로직
 */

import { useMemo } from 'react'
import type { Settlement } from '@/types/domain'

export function useSettlementReview(
  settlement: Settlement | null,
  onApprove: (settlement: Settlement) => Promise<void>,
  onReject: (settlement: Settlement) => Promise<void>
) {
  // 승인 가능 여부 (pending, calculated, review 상태에서만 승인 가능)
  const canApprove = useMemo(() => {
    if (!settlement) return false
    return settlement.status === 'pending' || 
           settlement.status === 'calculated' || 
           settlement.status === 'review'
  }, [settlement])

  // 반려 가능 여부 (pending, calculated, review 상태에서만 반려 가능)
  const canReject = useMemo(() => {
    if (!settlement) return false
    return settlement.status === 'pending' || 
           settlement.status === 'calculated' || 
           settlement.status === 'review'
  }, [settlement])

  const handleApprove = async () => {
    if (!settlement || !canApprove) return
    await onApprove(settlement)
  }

  const handleReject = async () => {
    if (!settlement || !canReject) return
    await onReject(settlement)
  }

  return {
    canApprove,
    canReject,
    handleApprove,
    handleReject,
  }
}
