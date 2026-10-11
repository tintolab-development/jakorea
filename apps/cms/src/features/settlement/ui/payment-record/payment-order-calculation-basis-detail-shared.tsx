/**
 * 산정 기준 상세 모달 — read-only 공통 UI 조각
 */

import type { ReactNode } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { withProgramDetailTdDivider } from '@/features/program/shared/ui/program-detail-td-divider'
import type {
  PaymentOrderCalculationBasisDetailLodgingReceipt,
  PaymentOrderCalculationBasisDetailTransportPublicTransit,
} from './payment-order-calculation-basis-detail'
import { formatPaymentOrderCalculationWonPlain } from './payment-order-calculation-breakdown-table'

export const BASIS_DETAIL_INFO_FORM_CLASS =
  'payment-order-calculation-basis-detail-modal__detail-form'

/** 산정 기준 상세 — read-only 단일 열 격자 (`hideHeader`, `title` = aria-label) */
export function BasisDetailInfoForm({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <DetailInfoForm
      title={title}
      hideHeader
      mode="view"
      className={BASIS_DETAIL_INFO_FORM_CLASS}
    >
      {children}
    </DetailInfoForm>
  )
}

export function BasisDetailInfoFormRow({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <DetailInfoForm.Row type="single">
      <DetailInfoForm.Field label={label} view={children} />
    </DetailInfoForm.Row>
  )
}

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
    <BasisDetailInfoForm title="합계">
      <BasisDetailInfoFormRow label="합계">
        <BasisDetailReadOnlyValue>
          {formatPaymentOrderCalculationWonPlain(totalWon)}
        </BasisDetailReadOnlyValue>
      </BasisDetailInfoFormRow>
    </BasisDetailInfoForm>
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
