/**
 * 활동비 — 산정 기준 상세 read-only
 */

import type { PaymentOrderCalculationBasisDetailActivity } from './payment-order-calculation-basis-detail'
import {
  BasisDetailInfoForm,
  BasisDetailInfoFormRow,
  BasisDetailLodgingFeeValue,
  BasisDetailReadOnlyValue,
} from './payment-order-calculation-basis-detail-shared'
import { formatPaymentOrderCalculationWonPlain } from './payment-order-calculation-breakdown-table'

export function PaymentOrderCalculationBasisDetailActivityView({
  detail,
}: {
  detail: PaymentOrderCalculationBasisDetailActivity
}) {
  return (
    <BasisDetailInfoForm title="활동비 산정 기준">
      <BasisDetailInfoFormRow label="구분">
        <BasisDetailReadOnlyValue>{detail.categoryLabel}</BasisDetailReadOnlyValue>
      </BasisDetailInfoFormRow>
      <BasisDetailInfoFormRow label="활동비">
        <BasisDetailLodgingFeeValue fee={detail.activityFee} />
      </BasisDetailInfoFormRow>
      <BasisDetailInfoFormRow label="합계">
        <BasisDetailReadOnlyValue>
          {formatPaymentOrderCalculationWonPlain(detail.totalWon)}
        </BasisDetailReadOnlyValue>
      </BasisDetailInfoFormRow>
    </BasisDetailInfoForm>
  )
}
