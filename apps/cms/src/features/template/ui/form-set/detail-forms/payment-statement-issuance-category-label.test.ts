import { describe, expect, it } from 'vitest'
import type { PaymentOrderCalculationStatementLine } from '@/features/settlement-management/model/payment-order-admin-list'
import {
  resolvePaymentStatementIssuanceCategoryLabel,
  shortInstructorFeeGradeLabel,
} from './payment-statement-issuance-category-label'

describe('shortInstructorFeeGradeLabel', () => {
  it('GRADE_1 / 1급 강사비 → 1급', () => {
    expect(shortInstructorFeeGradeLabel('GRADE_1')).toBe('1급')
    expect(shortInstructorFeeGradeLabel('1급 강사비')).toBe('1급')
    expect(shortInstructorFeeGradeLabel('1급')).toBe('1급')
  })

  it('알 수 없으면 undefined', () => {
    expect(shortInstructorFeeGradeLabel('특강 강사비')).toBeUndefined()
    expect(shortInstructorFeeGradeLabel('')).toBeUndefined()
  })
})

describe('resolvePaymentStatementIssuanceCategoryLabel', () => {
  it('강사비는 basisDetail.categoryLabel(API)로 등급을 표시하고 3급을 고정하지 않는다', () => {
    const line: PaymentOrderCalculationStatementLine = {
      id: '1',
      itemLabel: '강사비',
      description: '1급 강사비',
      amount: 240000,
      kind: 'lecture_fee',
      basisDetail: {
        layout: 'lectureFeeTier',
        tier: '1',
        categoryLabel: '1급 강사비',
        feeAssessmentWon: 240000,
        lectureTimeDisplay: '1차시',
        totalWon: 240000,
      },
    }
    expect(resolvePaymentStatementIssuanceCategoryLabel(line)).toBe('1급')
  })

  it('basisDetail 없이 description의 등급만으로도 표시한다', () => {
    const line: PaymentOrderCalculationStatementLine = {
      id: '2',
      itemLabel: '강사비',
      description: '2급 강사비',
      amount: 100000,
      kind: 'lecture_fee',
    }
    expect(resolvePaymentStatementIssuanceCategoryLabel(line)).toBe('2급')
  })

  it('등급을 알 수 없으면 - (3급 하드코딩 금지)', () => {
    const line: PaymentOrderCalculationStatementLine = {
      id: '3',
      itemLabel: '강사비',
      description: '강사비',
      amount: 100000,
      kind: 'lecture_fee',
    }
    expect(resolvePaymentStatementIssuanceCategoryLabel(line)).toBe('-')
  })

  it('원천징수는 taxIncomeTypeDisplay만 쓰고 없으면 -', () => {
    const withoutDisplay: PaymentOrderCalculationStatementLine = {
      id: '4',
      itemLabel: '원천징수',
      description: '원천징수',
      amount: -7920,
      kind: 'withholding',
      basisDetail: {
        layout: 'withholding',
        dailySalaryTotalWon: 240000,
        earnedIncomeDeductionWon: 0,
        incomeTaxRatePercent: 3.3,
        incomeTaxWon: 7920,
        earnedIncomeTaxCreditWon: 0,
        withholdingTaxAmountWon: 7920,
      },
    }
    expect(resolvePaymentStatementIssuanceCategoryLabel(withoutDisplay)).toBe('-')

    const withDisplay: PaymentOrderCalculationStatementLine = {
      ...withoutDisplay,
      taxIncomeTypeDisplay: '사업소득',
    }
    expect(resolvePaymentStatementIssuanceCategoryLabel(withDisplay)).toBe('사업소득')
  })
})
