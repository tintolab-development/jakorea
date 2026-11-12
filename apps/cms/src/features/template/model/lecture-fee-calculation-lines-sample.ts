/**
 * 지급조서(발급용) — 「강사비 산출 내역」 양식 관리 미리보기용 견본 데이터.
 * 기관명·일자는 실제 값처럼 보이지 않도록 자리 표시를 쓰고(QA-0171),
 * 금액은 모두 표시하며 합계는 라인 amount 합(지급 항목 − 공제 항목)과 일치한다(QA-0290).
 */

import type { PaymentOrderCalculationStatementSessionBlock } from '@/features/settlement-management/model/payment-order-admin-list'

/** 발급용 「강사비 산출 내역」테이블에 바인딩할 데이터 */
export type PaymentStatementCalculationLinesViewModel = {
  blocks: PaymentOrderCalculationStatementSessionBlock[]
  formulaLabel: string
  totalAmount: number
  /** 개인형 프로그램 — 「참여 기관명」열 자체를 그리지 않는다 */
  hideInstitutionColumn?: boolean
}

const lectureFee = 240_000
const transportFee = 95_000
const lodgingFee = 80_000
const subtotalBeforeTax = lectureFee + transportFee + lodgingFee
const withholdingAmount = -Math.round(subtotalBeforeTax * 0.088)

/** 견본 자리 표시 — 실제 기관명·일자로 오인하지 않게 한다 */
export const LECTURE_FEE_CALCULATION_LINES_SAMPLE_INSTITUTION_PLACEHOLDER = '참여 기관명'
export const LECTURE_FEE_CALCULATION_LINES_SAMPLE_DATE_PLACEHOLDER = 'YYYY. MM. DD(요일)'

export const LECTURE_FEE_CALCULATION_LINES_SAMPLE_BLOCKS: PaymentOrderCalculationStatementSessionBlock[] =
  [
    {
      institutionName: LECTURE_FEE_CALCULATION_LINES_SAMPLE_INSTITUTION_PLACEHOLDER,
      lectureDateDisplay: LECTURE_FEE_CALCULATION_LINES_SAMPLE_DATE_PLACEHOLDER,
      lectureSessionDisplay: '2회차',
      lines: [
        {
          id: 'issuance-sample-lecture',
          itemLabel: '강사비',
          description: '프로그램 1회 강사비 (3급 강사)',
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
          itemLabel: '원천징수 8.8%',
          description: '원천징수 8.8%',
          amount: withholdingAmount,
          kind: 'withholding',
        },
      ],
    },
  ]

export const LECTURE_FEE_CALCULATION_LINES_SAMPLE_FORMULA_LABEL =
  '강사비 + 교통비 + 숙박비 - 원천징수'

/** 합계 = 총 지급액(강사비+교통비+숙박비 415,000원) − 원천징수 8.8%(36,520원) = 378,480원 */
export const LECTURE_FEE_CALCULATION_LINES_SAMPLE_TOTAL_AMOUNT =
  subtotalBeforeTax + withholdingAmount

export const LECTURE_FEE_CALCULATION_LINES_SAMPLE: PaymentStatementCalculationLinesViewModel = {
  blocks: LECTURE_FEE_CALCULATION_LINES_SAMPLE_BLOCKS,
  formulaLabel: LECTURE_FEE_CALCULATION_LINES_SAMPLE_FORMULA_LABEL,
  totalAmount: LECTURE_FEE_CALCULATION_LINES_SAMPLE_TOTAL_AMOUNT,
}
