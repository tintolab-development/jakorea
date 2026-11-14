import assert from 'node:assert/strict'
import { readInstructorSettlementCalculation } from './instructor-settlement-calculation-preview.ts'

const zeroOnline = readInstructorSettlementCalculation({
  canSubmit: false,
  blockerCode: 'SETTLEMENT_CALCULATION_ITEMS_REQUIRED',
  grossAmount: 0,
  withholdingTaxAmount: 0,
  netPaymentAmount: 0,
  calculationDetails: [
    {
      calculationType: 'LECTURE_FEE',
      resultAmount: 0,
      basisJsonb: JSON.stringify({
        instructorFeeCalculationUnit: 'PER_HOUR',
        instructorFeeAmount: 100000,
        recognizedSessionCount: 0,
        actualTrainingMinutes: 25,
      }),
    },
    {
      calculationType: 'TRANSPORTATION',
      resultAmount: 0,
      basisJsonb: JSON.stringify({ distanceProvider: 'EDUCATION_FORM_ZERO', reason: 'EDUCATION_FORM_ZERO' }),
    },
  ],
})
assert.equal(zeroOnline?.lecture, '강사비: 100,000원 × 0차시 = 0원 (교육 25분)')
assert.equal(zeroOnline?.transportation, '교통비: 온라인·혼합 교육 0km → 0원')
assert.equal(zeroOnline?.gross, '0원')
assert.equal(zeroOnline?.withholding, '0원')
assert.equal(zeroOnline?.net, '0원')
assert.ok(zeroOnline?.explanation?.includes('신청할 수 없습니다'))

const payable = readInstructorSettlementCalculation({
  canSubmit: true,
  grossAmount: 200000,
  withholdingTaxAmount: 6600,
  netPaymentAmount: 193400,
  calculationDetails: [
    {
      calculationType: 'LECTURE_FEE',
      resultAmount: 200000,
      basisJsonb: JSON.stringify({
        instructorFeeCalculationUnit: 'PER_HOUR',
        instructorFeeAmount: 100000,
        recognizedSessionCount: 2,
        actualTrainingMinutes: 90,
      }),
    },
    {
      calculationType: 'TRANSPORTATION',
      resultAmount: 0,
      basisJsonb: JSON.stringify({ reason: 'BELOW_MINIMUM_DISTANCE' }),
    },
  ],
})
assert.equal(payable?.lecture, '강사비: 100,000원 × 2차시 = 200,000원 (교육 90분)')
assert.equal(payable?.transportation, '교통비: 최소 지급 거리 미달 → 0원')
assert.equal(payable?.net, '193,400원')
assert.equal(payable?.explanation, null)

// Never display or recompute inconsistent gross, withholding or net amounts.
assert.equal(readInstructorSettlementCalculation({
  grossAmount: 200000, withholdingTaxAmount: 6600, netPaymentAmount: 200000,
}), null)
assert.equal(readInstructorSettlementCalculation({
  grossAmount: 0, withholdingTaxAmount: 0, netPaymentAmount: null,
}), null)
