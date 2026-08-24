/**
 * 강사비 1~3급 — 산정 기준 상세 read-only 표
 */

import { ModalSpecTable, ModalSpecTableRow } from '@/shared/ui/modal-spec-table'
import type { PaymentOrderCalculationBasisDetailLectureFeeTier } from './payment-order-calculation-basis-detail'
import { BasisDetailReadOnlyValue } from './payment-order-calculation-basis-detail-shared'
import { formatPaymentOrderCalculationWonPlain } from './payment-order-calculation-breakdown-table'

export interface PaymentOrderCalculationBasisDetailLectureFeeTierViewProps {
  detail: PaymentOrderCalculationBasisDetailLectureFeeTier
}

export function PaymentOrderCalculationBasisDetailLectureFeeTierView({
  detail,
}: PaymentOrderCalculationBasisDetailLectureFeeTierViewProps) {
  return (
    <ModalSpecTable aria-label="강사비 산정 기준">
      <ModalSpecTableRow label="구분" labelVariant="basis">
        <BasisDetailReadOnlyValue>{detail.categoryLabel}</BasisDetailReadOnlyValue>
      </ModalSpecTableRow>
      <ModalSpecTableRow label="강의비 책정" labelVariant="basis">
        <BasisDetailReadOnlyValue>
          {formatPaymentOrderCalculationWonPlain(detail.feeAssessmentWon)}
        </BasisDetailReadOnlyValue>
      </ModalSpecTableRow>
      <ModalSpecTableRow label="강의 시간" labelVariant="basis">
        <BasisDetailReadOnlyValue>{detail.lectureTimeDisplay}</BasisDetailReadOnlyValue>
      </ModalSpecTableRow>
      <ModalSpecTableRow label="합계" labelVariant="basis">
        <BasisDetailReadOnlyValue>
          {formatPaymentOrderCalculationWonPlain(detail.totalWon)}
        </BasisDetailReadOnlyValue>
      </ModalSpecTableRow>
    </ModalSpecTable>
  )
}
