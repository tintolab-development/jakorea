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
      /*
       * 확인 처리·신청 반려 모두 결과 안내 모달(시안 3-6-2 / 3-3-2)을 산출 내역서 위에 띄운다.
       * 여기서 닫으면 산출 내역서가 언마운트되며 결과 모달도 같이 사라진다.
       * 확인 완료 후에는 산출 내역서가 「지급조서 확인 완료」 상태로 남는다(시안 3-6-3).
       */
      if (payload.status !== 'application_rejected' && payload.status !== 'confirmed') {
        closeCalculationStatement()
      }
    },
    [closeCalculationStatement]
  )

  return { registerStatementCommitSink, handleStatementLineCommitted }
}
