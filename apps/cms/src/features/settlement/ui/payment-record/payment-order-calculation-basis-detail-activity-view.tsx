/**
 * 활동비 — 산정 기준 상세 read-only 표
 */

import { ModalSpecTable, ModalSpecTableRow } from '@/shared/ui/modal-spec-table'
import type { PaymentOrderCalculationBasisDetailActivity } from './payment-order-calculation-basis-detail'
import {
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
    <ModalSpecTable aria-label="활동비 산정 기준">
      <ModalSpecTableRow label="구분" labelVariant="basis">
        <BasisDetailReadOnlyValue>{detail.categoryLabel}</BasisDetailReadOnlyValue>
      </ModalSpecTableRow>
      <ModalSpecTableRow label="활동비" labelVariant="basis">
        <BasisDetailLodgingFeeValue fee={detail.activityFee} />
      </ModalSpecTableRow>
      <ModalSpecTableRow label="합계" labelVariant="basis">
        <BasisDetailReadOnlyValue>
          {formatPaymentOrderCalculationWonPlain(detail.totalWon)}
        </BasisDetailReadOnlyValue>
      </ModalSpecTableRow>
    </ModalSpecTable>
  )
}
