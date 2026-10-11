/**
 * 식사비 — 산정 기준 상세 read-only
 */

import type { PaymentOrderCalculationBasisDetailMeal } from './payment-order-calculation-basis-detail'
import {
  BasisDetailInfoForm,
  BasisDetailInfoFormRow,
  BasisDetailLodgingFeeValue,
  BasisDetailReadOnlyValue,
} from './payment-order-calculation-basis-detail-shared'
import { formatPaymentOrderCalculationWonPlain } from './payment-order-calculation-breakdown-table'

export function PaymentOrderCalculationBasisDetailMealView({
  detail,
}: {
  detail: PaymentOrderCalculationBasisDetailMeal
}) {
  return (
    <BasisDetailInfoForm title="식사비 산정 기준">
      <BasisDetailInfoFormRow label="구분">
        <BasisDetailReadOnlyValue>{detail.categoryLabel}</BasisDetailReadOnlyValue>
      </BasisDetailInfoFormRow>
      <BasisDetailInfoFormRow label="식사비">
        <BasisDetailLodgingFeeValue fee={detail.mealFee} />
      </BasisDetailInfoFormRow>
      <BasisDetailInfoFormRow label="합계">
        <BasisDetailReadOnlyValue>
          {formatPaymentOrderCalculationWonPlain(detail.totalWon)}
        </BasisDetailReadOnlyValue>
      </BasisDetailInfoFormRow>
    </BasisDetailInfoForm>
  )
}
