/**
 * 지급조서(발급용) — 「강의비 산출 내역」 미리보기용 목 데이터.
 * 스크린샷 예시(기관명·일자·차시·항목 라벨)에 맞추고, 금액 합계는 라인 amount 합과 일치한다.
 */

import type { PaymentOrderCalculationStatementSessionBlock } from '@/data/mock/payment-order-admin-list'

/** 발급용 「강의비 산출 내역」테이블에 바인딩할 데이터 */
export type PaymentStatementCalculationLinesViewModel = {
  blocks: PaymentOrderCalculationStatementSessionBlock[]
  formulaLabel: string
  totalAmount: number
}

const lectureFee = 240_000
const transportFee = 95_000
const lodgingFee = 80_000
const subtotalBeforeTax = lectureFee + transportFee + lodgingFee
const withholdingAmount = -Math.round(subtotalBeforeTax * 0.088)

export const LECTURE_FEE_CALCULATION_LINES_SAMPLE_BLOCKS: PaymentOrderCalculationStatementSessionBlock[] =
  [
    {
      institutionName: '강서초등학교',
      lectureDateDisplay: '2026. 01. 28(수)',
      lectureSessionDisplay: '2 ~ 3차시',
      lines: [
        {
          id: 'issuance-sample-lecture',
          itemLabel: '강사비',
          description: '프로그램 1회 강의비 (3급 강사)',
          amount: lectureFee,
          kind: 'lecture_fee',
        },
        {
          id: 'issuance-sample-travel',
          itemLabel: '교통비',
          description: '',
          amount: transportFee,
          kind: 'travel',
        },
        {
          id: 'issuance-sample-lodging',
          itemLabel: '숙박비',
          description: '8만원 고정 지급',
          amount: lodgingFee,
          kind: 'lodging',
        },
        {
          id: 'issuance-sample-tax',
          itemLabel: '원천징수',
          description: '원천징수 8.8%',
          amount: withholdingAmount,
          kind: 'withholding',
          amountDisplayOverride: 'NN,NNN원',
        },
      ],
    },
  ]

export const LECTURE_FEE_CALCULATION_LINES_SAMPLE_FORMULA_LABEL =
  '강의비 + 교통비 + 숙박비 - 원천징수'

export const LECTURE_FEE_CALCULATION_LINES_SAMPLE_TOTAL_AMOUNT =
  LECTURE_FEE_CALCULATION_LINES_SAMPLE_BLOCKS[0]!.lines.reduce((s, l) => s + l.amount, 0)

export const LECTURE_FEE_CALCULATION_LINES_SAMPLE: PaymentStatementCalculationLinesViewModel = {
  blocks: LECTURE_FEE_CALCULATION_LINES_SAMPLE_BLOCKS,
  formulaLabel: LECTURE_FEE_CALCULATION_LINES_SAMPLE_FORMULA_LABEL,
  totalAmount: LECTURE_FEE_CALCULATION_LINES_SAMPLE_TOTAL_AMOUNT,
}
