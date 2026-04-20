/**
 * 산출 내역서 라인 커밋 → 하위 테이블 싱크(ref) + 모달 닫힘 제어
 */

import { useCallback, useRef } from 'react'
import type { PaymentOrderCalculationStatementCommitPayload } from '@/pages/settlement-management/payment-order-detail-fullpage-shared'

export function usePaymentOrderStatementCommitBridge(closeCalculationStatement: () => void) {
  const statementCommitSinkRef = useRef<
    ((payload: PaymentOrderCalculationStatementCommitPayload) => void) | null
  >(null)

  const registerStatementCommitSink = useCallback(
    (sink: (payload: PaymentOrderCalculationStatementCommitPayload) => void) => {
      statementCommitSinkRef.current = sink
    },
    []
  )

  const handleStatementLineCommitted = useCallback(
    (payload: PaymentOrderCalculationStatementCommitPayload) => {
      statementCommitSinkRef.current?.(payload)
      /* 신청 반려는 결과 안내 모달을 닫을 때까지 산출 내역서 데이터를 유지(형제 모달 언마운트 방지) */
      if (payload.status !== 'application_rejected') {
        closeCalculationStatement()
      }
    },
    [closeCalculationStatement]
  )

  return { registerStatementCommitSink, handleStatementLineCommitted }
}
