import {
  DISTANCE_SNAPSHOT_UNLINKED_NOTICE,
  type PaymentOrderCalculationBasisDetailTransportSnapshot,
} from './payment-order-calculation-basis-detail'
import {
  BasisDetailInfoForm,
  BasisDetailInfoFormRow,
  BasisDetailReadOnlyValue,
} from './payment-order-calculation-basis-detail-shared'
import { formatPaymentOrderCalculationWonPlain } from './payment-order-calculation-breakdown-table'
import { formatDateTimeDot } from '@/shared/utils/date'

function formatDistance(distanceKm?: number): string {
  return distanceKm == null || !Number.isFinite(distanceKm) ? '-' : `${distanceKm.toFixed(3)}km`
}

export function PaymentOrderCalculationBasisDetailTransportSnapshotView({
  detail,
}: {
  detail: PaymentOrderCalculationBasisDetailTransportSnapshot
}) {
  if (detail.distanceSnapshotUnlinked) {
    return (
      <BasisDetailInfoForm title="교통비 산정 기준">
        <BasisDetailInfoFormRow label="거리 스냅샷">
          <BasisDetailReadOnlyValue>{DISTANCE_SNAPSHOT_UNLINKED_NOTICE}</BasisDetailReadOnlyValue>
        </BasisDetailInfoFormRow>
        <BasisDetailInfoFormRow label="산출 교통비">
          <BasisDetailReadOnlyValue>
            {detail.calculatedTransportAmount == null
              ? '-'
              : formatPaymentOrderCalculationWonPlain(detail.calculatedTransportAmount)}
          </BasisDetailReadOnlyValue>
        </BasisDetailInfoFormRow>
      </BasisDetailInfoForm>
    )
  }

  return (
    <BasisDetailInfoForm title="교통비 산정 기준">
      <BasisDetailInfoFormRow label="거리 산정 업체">
        <BasisDetailReadOnlyValue>{detail.provider ?? '-'}</BasisDetailReadOnlyValue>
      </BasisDetailInfoFormRow>
      <BasisDetailInfoFormRow label="편도 거리">
        <BasisDetailReadOnlyValue>
          {formatDistance(detail.oneWayDistanceKm)}
        </BasisDetailReadOnlyValue>
      </BasisDetailInfoFormRow>
      <BasisDetailInfoFormRow label="왕복 거리">
        <BasisDetailReadOnlyValue>
          {formatDistance(detail.roundTripDistanceKm)}
        </BasisDetailReadOnlyValue>
      </BasisDetailInfoFormRow>
      <BasisDetailInfoFormRow label="유류 종류">
        <BasisDetailReadOnlyValue>{detail.fuelType ?? '-'}</BasisDetailReadOnlyValue>
      </BasisDetailInfoFormRow>
      <BasisDetailInfoFormRow label="유류비">
        <BasisDetailReadOnlyValue>
          {detail.fuelCostWon == null
            ? '-'
            : formatPaymentOrderCalculationWonPlain(detail.fuelCostWon)}
        </BasisDetailReadOnlyValue>
      </BasisDetailInfoFormRow>
      <BasisDetailInfoFormRow label="톨게이트비">
        <BasisDetailReadOnlyValue>
          {detail.tollAmount == null
            ? '-'
            : formatPaymentOrderCalculationWonPlain(detail.tollAmount)}
        </BasisDetailReadOnlyValue>
      </BasisDetailInfoFormRow>
      <BasisDetailInfoFormRow label="산출 교통비">
        <BasisDetailReadOnlyValue>
          {detail.calculatedTransportAmount == null
            ? '-'
            : formatPaymentOrderCalculationWonPlain(detail.calculatedTransportAmount)}
        </BasisDetailReadOnlyValue>
      </BasisDetailInfoFormRow>
      <BasisDetailInfoFormRow label="스냅샷 기준 시각">
        <BasisDetailReadOnlyValue>
          {formatDateTimeDot(detail.snapshotAt)}
        </BasisDetailReadOnlyValue>
      </BasisDetailInfoFormRow>
    </BasisDetailInfoForm>
  )
}
