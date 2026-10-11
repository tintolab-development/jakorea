/**
 * 원천징수 — 산정 기준 상세 read-only
 */

import type { PaymentOrderCalculationBasisDetailWithholding } from './payment-order-calculation-basis-detail'
import {
  BasisDetailInfoForm,
  BasisDetailInfoFormRow,
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
    <BasisDetailInfoForm title="원천징수 산정 기준">
      <BasisDetailInfoFormRow label="1일 급여 총액">
        <BasisDetailReadOnlyValue>
          {formatPaymentOrderCalculationWonPlain(detail.dailySalaryTotalWon)}
        </BasisDetailReadOnlyValue>
      </BasisDetailInfoFormRow>
      <BasisDetailInfoFormRow label="근로소득공제비용">
        <BasisDetailReadOnlyValue>
          {formatPaymentOrderCalculationWonPlain(detail.earnedIncomeDeductionWon)}
        </BasisDetailReadOnlyValue>
      </BasisDetailInfoFormRow>
      <BasisDetailInfoFormRow label="소득세">
        <BasisDetailRateAndAmountValue
          rateLabel={`${detail.incomeTaxRatePercent}%`}
          amountWon={detail.incomeTaxWon}
        />
      </BasisDetailInfoFormRow>
      <BasisDetailInfoFormRow label="근로소득세액공제">
        <BasisDetailReadOnlyValue>
          {formatPaymentOrderCalculationWonPlain(detail.earnedIncomeTaxCreditWon)}
        </BasisDetailReadOnlyValue>
      </BasisDetailInfoFormRow>
      <BasisDetailInfoFormRow label="원천징수세액">
        <BasisDetailReadOnlyValue>
          {formatPaymentOrderCalculationWonPlain(detail.withholdingTaxAmountWon)}
        </BasisDetailReadOnlyValue>
      </BasisDetailInfoFormRow>
    </BasisDetailInfoForm>
  )
}
