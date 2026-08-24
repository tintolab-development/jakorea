/**
 * 숙박비 — 산정 기준 상세 read-only 표 (일반 · 1사1교)
 */

import { ModalSpecTable, ModalSpecTableRow } from '@/shared/ui/modal-spec-table'
import type {
  PaymentOrderCalculationBasisDetailLodging1s1g,
  PaymentOrderCalculationBasisDetailLodgingGeneral,
} from './payment-order-calculation-basis-detail'
import {
  BasisDetailLodgingFeeValue,
  BasisDetailReadOnlyValue,
} from './payment-order-calculation-basis-detail-shared'
import { formatPaymentOrderCalculationWonPlain } from './payment-order-calculation-breakdown-table'

function LodgingBasisDetailTable({
  detail,
  ariaLabel,
}: {
  detail: PaymentOrderCalculationBasisDetailLodgingGeneral | PaymentOrderCalculationBasisDetailLodging1s1g
  ariaLabel: string
}) {
  return (
    <ModalSpecTable aria-label={ariaLabel}>
      <ModalSpecTableRow label="구분" labelVariant="basis">
        <BasisDetailReadOnlyValue>{detail.categoryLabel}</BasisDetailReadOnlyValue>
      </ModalSpecTableRow>
      <ModalSpecTableRow label="숙박일수" labelVariant="basis">
        <BasisDetailReadOnlyValue>{detail.nightsDisplay}</BasisDetailReadOnlyValue>
      </ModalSpecTableRow>
      <ModalSpecTableRow label="숙박비" labelVariant="basis">
        <BasisDetailLodgingFeeValue fee={detail.lodgingFee} />
      </ModalSpecTableRow>
      <ModalSpecTableRow label="합계" labelVariant="basis">
        <BasisDetailReadOnlyValue>
          {formatPaymentOrderCalculationWonPlain(detail.totalWon)}
        </BasisDetailReadOnlyValue>
      </ModalSpecTableRow>
    </ModalSpecTable>
  )
}

export function PaymentOrderCalculationBasisDetailLodgingGeneralView({
  detail,
}: {
  detail: PaymentOrderCalculationBasisDetailLodgingGeneral
}) {
  return <LodgingBasisDetailTable detail={detail} ariaLabel="숙박비 산정 기준" />
}

export function PaymentOrderCalculationBasisDetailLodging1s1gView({
  detail,
}: {
  detail: PaymentOrderCalculationBasisDetailLodging1s1g
}) {
  return <LodgingBasisDetailTable detail={detail} ariaLabel="1사1교 숙박비 산정 기준" />
}
