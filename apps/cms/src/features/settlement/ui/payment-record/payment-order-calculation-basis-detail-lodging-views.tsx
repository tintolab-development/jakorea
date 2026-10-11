/**
 * 숙박비 — 산정 기준 상세 read-only (일반 · 1사1교)
 */

import type {
  PaymentOrderCalculationBasisDetailLodging1s1g,
  PaymentOrderCalculationBasisDetailLodgingGeneral,
} from './payment-order-calculation-basis-detail'
import {
  BasisDetailInfoForm,
  BasisDetailInfoFormRow,
  BasisDetailLodgingFeeValue,
  BasisDetailReadOnlyValue,
} from './payment-order-calculation-basis-detail-shared'
import { formatPaymentOrderCalculationWonPlain } from './payment-order-calculation-breakdown-table'

function LodgingBasisDetailTable({
  detail,
  title,
}: {
  detail: PaymentOrderCalculationBasisDetailLodgingGeneral | PaymentOrderCalculationBasisDetailLodging1s1g
  title: string
}) {
  return (
    <BasisDetailInfoForm title={title}>
      <BasisDetailInfoFormRow label="구분">
        <BasisDetailReadOnlyValue>{detail.categoryLabel}</BasisDetailReadOnlyValue>
      </BasisDetailInfoFormRow>
      <BasisDetailInfoFormRow label="숙박일수">
        <BasisDetailReadOnlyValue>{detail.nightsDisplay}</BasisDetailReadOnlyValue>
      </BasisDetailInfoFormRow>
      <BasisDetailInfoFormRow label="숙박비">
        <BasisDetailLodgingFeeValue fee={detail.lodgingFee} />
      </BasisDetailInfoFormRow>
      <BasisDetailInfoFormRow label="합계">
        <BasisDetailReadOnlyValue>
          {formatPaymentOrderCalculationWonPlain(detail.totalWon)}
        </BasisDetailReadOnlyValue>
      </BasisDetailInfoFormRow>
    </BasisDetailInfoForm>
  )
}

export function PaymentOrderCalculationBasisDetailLodgingGeneralView({
  detail,
}: {
  detail: PaymentOrderCalculationBasisDetailLodgingGeneral
}) {
  return <LodgingBasisDetailTable detail={detail} title="숙박비 산정 기준" />
}

export function PaymentOrderCalculationBasisDetailLodging1s1gView({
  detail,
}: {
  detail: PaymentOrderCalculationBasisDetailLodging1s1g
}) {
  return <LodgingBasisDetailTable detail={detail} title="1사1교 숙박비 산정 기준" />
}
