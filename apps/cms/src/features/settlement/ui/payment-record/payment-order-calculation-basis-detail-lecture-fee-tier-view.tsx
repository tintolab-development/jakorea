/**
 * 강사비 1~3급 · 특강 — 산정 기준 상세 read-only
 */

import type {
  PaymentOrderCalculationBasisDetailLectureFeeGemini,
  PaymentOrderCalculationBasisDetailLectureFeeSpecial,
  PaymentOrderCalculationBasisDetailLectureFeeTier,
} from './payment-order-calculation-basis-detail'
import {
  BasisDetailInfoForm,
  BasisDetailInfoFormRow,
  BasisDetailReadOnlyValue,
} from './payment-order-calculation-basis-detail-shared'
import { formatPaymentOrderCalculationWonPlain } from './payment-order-calculation-breakdown-table'

interface LectureFeeBasisTableDetail {
  categoryLabel: string
  feeAssessmentWon: number
  lectureTimeDisplay: string
  totalWon: number
}

function PaymentOrderCalculationBasisDetailLectureFeeTable({
  detail,
  title,
}: {
  detail: LectureFeeBasisTableDetail
  title: string
}) {
  return (
    <BasisDetailInfoForm title={title}>
      <BasisDetailInfoFormRow label="구분">
        <BasisDetailReadOnlyValue>{detail.categoryLabel}</BasisDetailReadOnlyValue>
      </BasisDetailInfoFormRow>
      <BasisDetailInfoFormRow label="강사비 책정">
        <BasisDetailReadOnlyValue>
          {formatPaymentOrderCalculationWonPlain(detail.feeAssessmentWon)}
        </BasisDetailReadOnlyValue>
      </BasisDetailInfoFormRow>
      <BasisDetailInfoFormRow label="강의 시간">
        <BasisDetailReadOnlyValue>{detail.lectureTimeDisplay}</BasisDetailReadOnlyValue>
      </BasisDetailInfoFormRow>
      <BasisDetailInfoFormRow label="합계">
        <BasisDetailReadOnlyValue>
          {formatPaymentOrderCalculationWonPlain(detail.totalWon)}
        </BasisDetailReadOnlyValue>
      </BasisDetailInfoFormRow>
    </BasisDetailInfoForm>
  )
}

export interface PaymentOrderCalculationBasisDetailLectureFeeTierViewProps {
  detail: PaymentOrderCalculationBasisDetailLectureFeeTier
}

export function PaymentOrderCalculationBasisDetailLectureFeeTierView({
  detail,
}: PaymentOrderCalculationBasisDetailLectureFeeTierViewProps) {
  return (
    <PaymentOrderCalculationBasisDetailLectureFeeTable detail={detail} title="강사비 산정 기준" />
  )
}

export interface PaymentOrderCalculationBasisDetailLectureFeeSpecialViewProps {
  detail: PaymentOrderCalculationBasisDetailLectureFeeSpecial
}

export function PaymentOrderCalculationBasisDetailLectureFeeSpecialView({
  detail,
}: PaymentOrderCalculationBasisDetailLectureFeeSpecialViewProps) {
  return (
    <PaymentOrderCalculationBasisDetailLectureFeeTable
      detail={detail}
      title="특강 강사비 산정 기준"
    />
  )
}

export interface PaymentOrderCalculationBasisDetailLectureFeeGeminiViewProps {
  detail: PaymentOrderCalculationBasisDetailLectureFeeGemini
}

export function PaymentOrderCalculationBasisDetailLectureFeeGeminiView({
  detail,
}: PaymentOrderCalculationBasisDetailLectureFeeGeminiViewProps) {
  return (
    <BasisDetailInfoForm title="제미나이 강사비 산정 기준">
      <BasisDetailInfoFormRow label="구분">
        <BasisDetailReadOnlyValue>{detail.categoryLabel}</BasisDetailReadOnlyValue>
      </BasisDetailInfoFormRow>
      <BasisDetailInfoFormRow label="강의 시간">
        <BasisDetailReadOnlyValue>{detail.lectureTimeDisplay}</BasisDetailReadOnlyValue>
      </BasisDetailInfoFormRow>
      <BasisDetailInfoFormRow label="강사비 책정">
        <BasisDetailReadOnlyValue>
          {formatPaymentOrderCalculationWonPlain(detail.feeAssessmentWon)}
        </BasisDetailReadOnlyValue>
      </BasisDetailInfoFormRow>
    </BasisDetailInfoForm>
  )
}
