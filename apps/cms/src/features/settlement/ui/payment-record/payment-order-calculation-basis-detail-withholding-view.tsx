/**
 * 원천징수 — 산정 기준 상세 read-only 표
 */

import { ModalSpecTable, ModalSpecTableRow } from '@/shared/ui/modal-spec-table'
import type { PaymentOrderCalculationBasisDetailWithholding } from './payment-order-calculation-basis-detail'
import {
  BasisDetailRateAndAmountValue,
  BasisDetailReadOnlyValue,
} from './payment-order-calculation-basis-detail-shared'
import { formatPaymentOrderCalculationWonPlain } from './payment-order-calculation-breakdown-table'

export function PaymentOrderCalculationBasisDetailWithholdingView({
  detail,
}: {
  detail: PaymentOrderCalculationBasisDetailWithholding
}) {
  return (
    <ModalSpecTable aria-label="원천징수 산정 기준">
      <ModalSpecTableRow label="1일 급여 총액" labelVariant="basis">
        <BasisDetailReadOnlyValue>
          {formatPaymentOrderCalculationWonPlain(detail.dailySalaryTotalWon)}
        </BasisDetailReadOnlyValue>
      </ModalSpecTableRow>
      <ModalSpecTableRow label="근로소득공제비용" labelVariant="basis">
        <BasisDetailReadOnlyValue>
          {formatPaymentOrderCalculationWonPlain(detail.earnedIncomeDeductionWon)}
        </BasisDetailReadOnlyValue>
      </ModalSpecTableRow>
      <ModalSpecTableRow label="소득세" labelVariant="basis">
        <BasisDetailRateAndAmountValue
          rateLabel={`${detail.incomeTaxRatePercent}%`}
          amountWon={detail.incomeTaxWon}
        />
      </ModalSpecTableRow>
      <ModalSpecTableRow label="근로소득세액공제" labelVariant="basis">
        <BasisDetailReadOnlyValue>
          {formatPaymentOrderCalculationWonPlain(detail.earnedIncomeTaxCreditWon)}
        </BasisDetailReadOnlyValue>
      </ModalSpecTableRow>
      <ModalSpecTableRow label="원천징수세액" labelVariant="basis">
        <BasisDetailReadOnlyValue>
          {formatPaymentOrderCalculationWonPlain(detail.withholdingTaxAmountWon)}
        </BasisDetailReadOnlyValue>
      </ModalSpecTableRow>
    </ModalSpecTable>
  )
}
