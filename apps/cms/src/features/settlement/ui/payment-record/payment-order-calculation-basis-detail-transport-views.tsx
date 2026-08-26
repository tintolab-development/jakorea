/**
 * 교통비 — 산정 기준 상세 read-only 표 (학생 왕복·편도, 강사 1사1교)
 */

import { ModalSpecTable, ModalSpecTableRow } from '@/shared/ui/modal-spec-table'
import type {
  PaymentOrderCalculationBasisDetailTransportInstructor,
  PaymentOrderCalculationBasisDetailTransportOneWay,
  PaymentOrderCalculationBasisDetailTransportRoundTrip,
  PaymentOrderCalculationBasisDetailTransportTripLeg,
} from './payment-order-calculation-basis-detail'
import {
  BasisDetailPublicTransitValue,
  BasisDetailReadOnlyValue,
  BasisDetailSectionLabel,
  BasisDetailTotalRow,
} from './payment-order-calculation-basis-detail-shared'
import { formatPaymentOrderCalculationWonPlain } from './payment-order-calculation-breakdown-table'
import { withProgramDetailTdDivider } from '@/features/program/shared/ui/program-detail-td-divider'

function TransportParticipantTripLegTable({
  leg,
  ariaLabel,
}: {
  leg: PaymentOrderCalculationBasisDetailTransportTripLeg
  ariaLabel: string
}) {
  return (
    <ModalSpecTable aria-label={ariaLabel}>
      <ModalSpecTableRow label="구분" labelVariant="basis">
        <BasisDetailReadOnlyValue>{leg.categoryLabel}</BasisDetailReadOnlyValue>
      </ModalSpecTableRow>
      <ModalSpecTableRow label="대중교통비" labelVariant="basis">
        <BasisDetailPublicTransitValue segment={leg.publicTransit} />
      </ModalSpecTableRow>
    </ModalSpecTable>
  )
}

export function PaymentOrderCalculationBasisDetailTransportRoundTripView({
  detail,
}: {
  detail: PaymentOrderCalculationBasisDetailTransportRoundTrip
}) {
  return (
    <div className="payment-order-calculation-basis-detail-modal__section-stack">
      <section aria-labelledby="transport-basis-outbound-label">
        <BasisDetailSectionLabel id="transport-basis-outbound-label">
          가는 편(출발)
        </BasisDetailSectionLabel>
        <TransportParticipantTripLegTable leg={detail.outbound} ariaLabel="가는 편 산정 기준" />
      </section>
      <section aria-labelledby="transport-basis-inbound-label">
        <BasisDetailSectionLabel id="transport-basis-inbound-label">
          오는 편(귀가)
        </BasisDetailSectionLabel>
        <TransportParticipantTripLegTable leg={detail.inbound} ariaLabel="오는 편 산정 기준" />
      </section>
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
    <TransportParticipantTripLegTable leg={detail.trip} ariaLabel="교통비 산정 기준" />
  )
}

export function PaymentOrderCalculationBasisDetailTransportInstructorView({
  detail,
}: {
  detail: PaymentOrderCalculationBasisDetailTransportInstructor
}) {
  return (
    <ModalSpecTable aria-label="강사 교통비 산정 기준">
      <ModalSpecTableRow label="구분" labelVariant="basis">
        <BasisDetailReadOnlyValue>{detail.categoryLabel}</BasisDetailReadOnlyValue>
      </ModalSpecTableRow>
      <ModalSpecTableRow label="이동 거리 및 유류비" labelVariant="basis">
        <BasisDetailReadOnlyValue>
          {withProgramDetailTdDivider([
            `${detail.distanceKm}km`,
            formatPaymentOrderCalculationWonPlain(detail.fuelCostWon),
          ])}
        </BasisDetailReadOnlyValue>
      </ModalSpecTableRow>
      <ModalSpecTableRow label="톨게이트비" labelVariant="basis">
        <BasisDetailReadOnlyValue>
          {formatPaymentOrderCalculationWonPlain(detail.tollFeeWon)}
        </BasisDetailReadOnlyValue>
      </ModalSpecTableRow>
      <ModalSpecTableRow label="합계" labelVariant="basis">
        <BasisDetailReadOnlyValue>
          {formatPaymentOrderCalculationWonPlain(detail.totalWon)}
        </BasisDetailReadOnlyValue>
      </ModalSpecTableRow>
    </ModalSpecTable>
  )
}
