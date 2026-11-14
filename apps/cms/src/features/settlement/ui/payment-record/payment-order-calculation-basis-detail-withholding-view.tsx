/**
 * 원천징수 — 산정 기준 상세 read-only
 */

import type {
  PaymentOrderCalculationBasisDetailWithholding,
  PaymentOrderCalculationBasisDetailWithholdingRate,
} from './payment-order-calculation-basis-detail'
import {
  BasisDetailInfoForm,
  BasisDetailInfoFormRow,
  BasisDetailRateAndAmountValue,
  BasisDetailReadOnlyValue,
} from './payment-order-calculation-basis-detail-shared'
import { formatPaymentOrderCalculationWonPlain } from './payment-order-calculation-breakdown-table'
import {
  ProgramDetailTdSegmentWrap,
  withProgramDetailTdDivider,
} from '@/features/program/shared/ui/program-detail-td-divider'

export function PaymentOrderCalculationBasisDetailWithholdingView({
  detail,
}: {
  detail: PaymentOrderCalculationBasisDetailWithholding
}) {
  return (
    <BasisDetailInfoForm title="원천징수 산정 기준">
      <BasisDetailInfoFormRow label="1일 급여 총액">
        <BasisDetailReadOnlyValue>
          {formatPaymentOrderCalculationWonPlain(detail.dailySalaryTotalWon)}
        </BasisDetailReadOnlyValue>
      </BasisDetailInfoFormRow>
      <BasisDetailInfoFormRow label="근로소득공제비용">
        <BasisDetailReadOnlyValue>
          {formatPaymentOrderCalculationWonPlain(detail.earnedIncomeDeductionWon)}
        </BasisDetailReadOnlyValue>
      </BasisDetailInfoFormRow>
      <BasisDetailInfoFormRow label="소득세">
        <BasisDetailRateAndAmountValue
          rateLabel={`${detail.incomeTaxRatePercent}%`}
          amountWon={detail.incomeTaxWon}
        />
      </BasisDetailInfoFormRow>
      <BasisDetailInfoFormRow label="근로소득세액공제">
        <BasisDetailReadOnlyValue>
          {formatPaymentOrderCalculationWonPlain(detail.earnedIncomeTaxCreditWon)}
        </BasisDetailReadOnlyValue>
      </BasisDetailInfoFormRow>
      <BasisDetailInfoFormRow label="원천징수세액">
        <BasisDetailReadOnlyValue>
          {formatPaymentOrderCalculationWonPlain(detail.withholdingTaxAmountWon)}
        </BasisDetailReadOnlyValue>
      </BasisDetailInfoFormRow>
    </BasisDetailInfoForm>
  )
}

/**
 * 원천징수(세율 방식) — 정산 항목 설정 「원천징수세액」 항목(소득 유형별 원천징수율·소액부징수 기준)을
 * 정산 당시 스냅샷 값으로 보여 준다.
 */
export function PaymentOrderCalculationBasisDetailWithholdingRateView({
  detail,
}: {
  detail: PaymentOrderCalculationBasisDetailWithholdingRate
}) {
  return (
    <BasisDetailInfoForm title="원천징수 산정 기준">
      <BasisDetailInfoFormRow label="소득 유형별 원천징수율">
        <BasisDetailReadOnlyValue>
          <ProgramDetailTdSegmentWrap>
            {withProgramDetailTdDivider([detail.taxIncomeTypeLabel, `${detail.ratePercent}%`])}
          </ProgramDetailTdSegmentWrap>
        </BasisDetailReadOnlyValue>
      </BasisDetailInfoFormRow>
      {detail.smallTaxExemptionThresholdWon != null ? (
        <BasisDetailInfoFormRow label="소액부징수 기준">
          <BasisDetailReadOnlyValue>
            {`원천징수세액(소득세)이 ${formatPaymentOrderCalculationWonPlain(detail.smallTaxExemptionThresholdWon)} 미만인 경우, 미징수`}
          </BasisDetailReadOnlyValue>
        </BasisDetailInfoFormRow>
      ) : null}
      <BasisDetailInfoFormRow label="과세 대상액">
        <BasisDetailReadOnlyValue>
          {formatPaymentOrderCalculationWonPlain(detail.taxableAmountWon)}
        </BasisDetailReadOnlyValue>
      </BasisDetailInfoFormRow>
      {detail.appliedRuleNotice ? (
        <BasisDetailInfoFormRow label="적용 안내">
          <BasisDetailReadOnlyValue>{detail.appliedRuleNotice}</BasisDetailReadOnlyValue>
        </BasisDetailInfoFormRow>
      ) : null}
      <BasisDetailInfoFormRow label="원천징수세액">
        <BasisDetailReadOnlyValue>
          {formatPaymentOrderCalculationWonPlain(detail.withholdingTaxAmountWon)}
        </BasisDetailReadOnlyValue>
      </BasisDetailInfoFormRow>
    </BasisDetailInfoForm>
  )
}
