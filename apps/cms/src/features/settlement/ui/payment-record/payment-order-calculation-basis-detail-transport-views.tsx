/**
 * 교통비 — 산정 기준 상세 read-only (학생 왕복·편도, 강사 1사1교)
 */

import type {
  PaymentOrderCalculationBasisDetailTransportInstructor,
  PaymentOrderCalculationBasisDetailTransportOneWay,
  PaymentOrderCalculationBasisDetailTransportRoundTrip,
  PaymentOrderCalculationBasisDetailTransportTripLeg,
} from './payment-order-calculation-basis-detail'
import { formatParticipantOneWayDistanceKm } from './payment-order-calculation-basis-detail'
import {
  BasisDetailInfoForm,
  BasisDetailInfoFormRow,
  BasisDetailPublicTransitValue,
  BasisDetailReadOnlyValue,
  BasisDetailTotalRow,
} from './payment-order-calculation-basis-detail-shared'
import { formatPaymentOrderCalculationWonPlain } from './payment-order-calculation-breakdown-table'
import {
  ProgramDetailTdSegmentWrap,
  withProgramDetailTdDivider,
} from '@/features/program/shared/ui/program-detail-td-divider'

function TransportParticipantTripLegTable({
  leg,
  title,
  hideHeader = true,
  oneWayDistanceKm,
}: {
  leg: PaymentOrderCalculationBasisDetailTransportTripLeg
  title: string
  hideHeader?: boolean
  oneWayDistanceKm?: number | null
}) {
  const distanceLabel = formatParticipantOneWayDistanceKm(oneWayDistanceKm)
  return (
    <BasisDetailInfoForm title={title} hideHeader={hideHeader}>
      <BasisDetailInfoFormRow label="구분">
        <BasisDetailReadOnlyValue>{leg.categoryLabel}</BasisDetailReadOnlyValue>
      </BasisDetailInfoFormRow>
      {distanceLabel ? (
        <BasisDetailInfoFormRow label="편도 거리">
          <BasisDetailReadOnlyValue>{distanceLabel}</BasisDetailReadOnlyValue>
        </BasisDetailInfoFormRow>
      ) : null}
      <BasisDetailInfoFormRow label="대중교통비">
        <BasisDetailPublicTransitValue segment={leg.publicTransit} />
      </BasisDetailInfoFormRow>
    </BasisDetailInfoForm>
  )
}

export function PaymentOrderCalculationBasisDetailTransportRoundTripView({
  detail,
}: {
  detail: PaymentOrderCalculationBasisDetailTransportRoundTrip
}) {
  return (
    <div className="payment-order-calculation-basis-detail-modal__section-stack">
      <TransportParticipantTripLegTable
        leg={detail.outbound}
        title="가는 편(출발)"
        hideHeader={false}
        oneWayDistanceKm={detail.oneWayDistanceKm}
      />
      <TransportParticipantTripLegTable
        leg={detail.inbound}
        title="오는 편(귀가)"
        hideHeader={false}
      />
      <BasisDetailTotalRow totalWon={detail.totalWon} />
    </div>
  )
}

export function PaymentOrderCalculationBasisDetailTransportOneWayView({
  detail,
}: {
  detail: PaymentOrderCalculationBasisDetailTransportOneWay
}) {
  return (
    <TransportParticipantTripLegTable
      leg={detail.trip}
      title="교통비 산정 기준"
      oneWayDistanceKm={detail.oneWayDistanceKm}
    />
  )
}

export function PaymentOrderCalculationBasisDetailTransportInstructorView({
  detail,
}: {
  detail: PaymentOrderCalculationBasisDetailTransportInstructor
}) {
  return (
    <BasisDetailInfoForm title="강사 교통비 산정 기준">
      <BasisDetailInfoFormRow label="구분">
        <BasisDetailReadOnlyValue>{detail.categoryLabel}</BasisDetailReadOnlyValue>
      </BasisDetailInfoFormRow>
      <BasisDetailInfoFormRow label="이동 거리 및 유류비">
        <BasisDetailReadOnlyValue>
          <ProgramDetailTdSegmentWrap>
            {withProgramDetailTdDivider([
              `${detail.distanceKm}km`,
              formatPaymentOrderCalculationWonPlain(detail.fuelCostWon),
            ])}
          </ProgramDetailTdSegmentWrap>
        </BasisDetailReadOnlyValue>
      </BasisDetailInfoFormRow>
      <BasisDetailInfoFormRow label="톨게이트비">
        <BasisDetailReadOnlyValue>
          {formatPaymentOrderCalculationWonPlain(detail.tollFeeWon)}
        </BasisDetailReadOnlyValue>
      </BasisDetailInfoFormRow>
      <BasisDetailInfoFormRow label="합계">
        <BasisDetailReadOnlyValue>
          {formatPaymentOrderCalculationWonPlain(detail.totalWon)}
        </BasisDetailReadOnlyValue>
      </BasisDetailInfoFormRow>
    </BasisDetailInfoForm>
  )
}
