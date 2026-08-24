/**
 * 산정 기준 상세 모달 — read-only 공통 UI 조각
 */

import type { ReactNode } from 'react'
import { ModalSpecTable, ModalSpecTableRow } from '@/shared/ui/modal-spec-table'
import { withProgramDetailTdDivider } from '@/features/program/shared/ui/program-detail-td-divider'
import type {
  PaymentOrderCalculationBasisDetailLodgingReceipt,
  PaymentOrderCalculationBasisDetailTransportPublicTransit,
} from './payment-order-calculation-basis-detail'
import { formatPaymentOrderCalculationWonPlain } from './payment-order-calculation-breakdown-table'

export function BasisDetailReadOnlyValue({ children }: { children: ReactNode }) {
  return (
    <span className="payment-order-calculation-basis-detail-modal__value">{children}</span>
  )
}

export function BasisDetailSectionLabel({
  id,
  children,
}: {
  id?: string
  children: ReactNode
}) {
  return (
    <h3
      id={id}
      className="payment-order-calculation-basis-detail-modal__section-label detail-info-form__title"
    >
      {children}
    </h3>
  )
}

export function BasisDetailTotalRow({ totalWon }: { totalWon: number }) {
  return (
    <ModalSpecTable aria-label="합계">
      <ModalSpecTableRow label="합계" labelVariant="basis">
        <BasisDetailReadOnlyValue>
          {formatPaymentOrderCalculationWonPlain(totalWon)}
        </BasisDetailReadOnlyValue>
      </ModalSpecTableRow>
    </ModalSpecTable>
  )
}

export function BasisDetailPublicTransitValue({
  segment,
}: {
  segment: PaymentOrderCalculationBasisDetailTransportPublicTransit
}) {
  const segments: ReactNode[] = [
    segment.modeLabel,
    formatPaymentOrderCalculationWonPlain(segment.amountWon),
  ]

  if (segment.receiptFileName) {
    segments.push(
      segment.receiptUrl ? (
        <a
          key="receipt"
          href={segment.receiptUrl}
          className="payment-order-calculation-basis-detail-modal__file-link"
          target="_blank"
          rel="noreferrer"
        >
          {segment.receiptFileName}
        </a>
      ) : (
        <button
          key="receipt"
          type="button"
          className="payment-order-calculation-basis-detail-modal__file-link"
        >
          {segment.receiptFileName}
        </button>
      )
    )
  }

  return (
    <BasisDetailReadOnlyValue>
      {withProgramDetailTdDivider(segments)}
    </BasisDetailReadOnlyValue>
  )
}

function renderReceiptLink(receiptFileName: string, receiptUrl?: string) {
  if (receiptUrl) {
    return (
      <a
        href={receiptUrl}
        className="payment-order-calculation-basis-detail-modal__file-link"
        target="_blank"
        rel="noreferrer"
      >
        {receiptFileName}
      </a>
    )
  }
  return (
    <button type="button" className="payment-order-calculation-basis-detail-modal__file-link">
      {receiptFileName}
    </button>
  )
}

export function BasisDetailLodgingFeeValue({
  fee,
}: {
  fee: PaymentOrderCalculationBasisDetailLodgingReceipt
}) {
  const segments: ReactNode[] = [formatPaymentOrderCalculationWonPlain(fee.amountWon)]

  if (fee.receiptFileName) {
    segments.push(renderReceiptLink(fee.receiptFileName, fee.receiptUrl))
  }

  return (
    <BasisDetailReadOnlyValue>
      {withProgramDetailTdDivider(segments)}
    </BasisDetailReadOnlyValue>
  )
}

export function BasisDetailRateAndAmountValue({
  rateLabel,
  amountWon,
}: {
  rateLabel: string
  amountWon: number
}) {
  return (
    <BasisDetailReadOnlyValue>
      {withProgramDetailTdDivider([rateLabel, formatPaymentOrderCalculationWonPlain(amountWon)])}
    </BasisDetailReadOnlyValue>
  )
}
