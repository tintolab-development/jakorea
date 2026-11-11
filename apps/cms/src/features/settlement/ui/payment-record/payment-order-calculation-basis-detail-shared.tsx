/**
 * 산정 기준 상세 모달 — read-only 공통 UI 조각
 */

import type { ReactNode } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import {
  ProgramDetailTdSegmentWrap,
  withProgramDetailTdDivider,
} from '@/features/program/shared/ui/program-detail-td-divider'
import { downloadAdminFile } from '@/shared/lib/admin-file-upload'
import { handleError } from '@/shared/utils/error-handler'
import { readApiErrorAlertMessage } from '@/shared/lib/extract-api-error-message'
import { useCmsAlert } from '@/shared/ui'
import type {
  PaymentOrderCalculationBasisDetailLodgingReceipt,
  PaymentOrderCalculationBasisDetailTransportPublicTransit,
} from './payment-order-calculation-basis-detail'
import { formatPaymentOrderCalculationWonPlain } from './payment-order-calculation-breakdown-table'

export const BASIS_DETAIL_INFO_FORM_CLASS =
  'payment-order-calculation-basis-detail-modal__detail-form'

/** 산정 기준 상세 — DetailInfoForm 읽기 전용 격자. 모달 제목과 겹치는 섹션 타이틀은 숨긴다. */
export function BasisDetailInfoForm({
  title,
  children,
  hideHeader = true,
}: {
  title: string
  children: ReactNode
  hideHeader?: boolean
}) {
  return (
    <DetailInfoForm
      title={title}
      hideHeader={hideHeader}
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
      <DetailInfoForm.Field label={label} view={children} readOnlyDisplay />
    </DetailInfoForm.Row>
  )
}

export function BasisDetailReadOnlyValue({ children }: { children: ReactNode }) {
  return children
}

export function BasisDetailTotalRow({ totalWon }: { totalWon: number }) {
  return (
    <BasisDetailInfoForm title="합계" hideHeader={false}>
      <BasisDetailInfoFormRow label="합계">
        <BasisDetailReadOnlyValue>
          {formatPaymentOrderCalculationWonPlain(totalWon)}
        </BasisDetailReadOnlyValue>
      </BasisDetailInfoFormRow>
    </BasisDetailInfoForm>
  )
}

function BasisDetailReceiptFileLink({
  fileName,
  url,
  fileObjectId,
}: {
  fileName: string
  url?: string
  fileObjectId?: number
}) {
  const { showAlert } = useCmsAlert()

  if (url) {
    return (
      <a
        href={url}
        className="payment-order-calculation-basis-detail-modal__file-link"
        title={fileName}
        target="_blank"
        rel="noreferrer"
      >
        {fileName}
      </a>
    )
  }

  const downloadable = fileObjectId != null

  return (
    <button
      type="button"
      className="payment-order-calculation-basis-detail-modal__file-link"
      title={fileName}
      onClick={() => {
        if (!downloadable) return
        void (async () => {
          try {
            await downloadAdminFile({ fileObjectId, fileName })
          } catch (error) {
            handleError(error, { context: 'paymentOrderCalculationBasisDetail.downloadFile' })
            showAlert({
              title: '안내',
              content: readApiErrorAlertMessage(error, '첨부파일을 다운로드하지 못했습니다.'),
            })
          }
        })()
      }}
    >
      {fileName}
    </button>
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
      <BasisDetailReceiptFileLink
        key="receipt"
        fileName={segment.receiptFileName}
        url={segment.receiptUrl}
        fileObjectId={segment.receiptFileObjectId}
      />
    )
  }

  return (
    <BasisDetailReadOnlyValue>
      <ProgramDetailTdSegmentWrap>
        {withProgramDetailTdDivider(segments)}
      </ProgramDetailTdSegmentWrap>
    </BasisDetailReadOnlyValue>
  )
}

export function BasisDetailLodgingFeeValue({
  fee,
}: {
  fee: PaymentOrderCalculationBasisDetailLodgingReceipt
}) {
  const segments: ReactNode[] = [formatPaymentOrderCalculationWonPlain(fee.amountWon)]

  if (fee.receiptFileName) {
    segments.push(
      <BasisDetailReceiptFileLink
        key="receipt"
        fileName={fee.receiptFileName}
        url={fee.receiptUrl}
        fileObjectId={fee.receiptFileObjectId}
      />
    )
  }

  return (
    <BasisDetailReadOnlyValue>
      <ProgramDetailTdSegmentWrap>
        {withProgramDetailTdDivider(segments)}
      </ProgramDetailTdSegmentWrap>
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
      <ProgramDetailTdSegmentWrap>
        {withProgramDetailTdDivider([
          rateLabel,
          formatPaymentOrderCalculationWonPlain(amountWon),
        ])}
      </ProgramDetailTdSegmentWrap>
    </BasisDetailReadOnlyValue>
  )
}
