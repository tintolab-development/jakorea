import { describe, expect, it } from 'vitest'
import type { SettlementApplicationDocumentResponse } from '@/shared/api/generated/settlement/schemas'
import type { PaymentOrderProgramCalculationStatement } from '@/features/settlement-management/model/payment-order-admin-list'
import {
  applyApplicationDocumentToProgramCalculationStatement,
  buildPaymentStatementPreviewOptionsFromApplicationDocument,
  formatEducationTimeRange,
  getSettlementApplicationDocumentErrorMessage,
} from './map-settlement-application-document-to-payment-statement-preview-options'

/** 요청서의 settlement_application id=14 응답 data */
const document14: SettlementApplicationDocumentResponse = {
  documentType: 'PAYMENT_STATEMENT',
  title: 'JA KOREA 정산 신청서',
  revisionNo: 1,
  submittedAt: '2026-11-07T17:01:46.865448Z',
  status: 'SUBMITTED',
  basicInfo: {
    name: '이순규',
    englishName: 'Soonkyu Lee',
    residentNumberMasked: '990909-2******',
    affiliation: null,
    homeAddress: '서울특별시 마포구 독막로 65-1 (상수동)',
    homeAddressDetail: '12',
    bank: '우리',
    accountNumberMasked: '************',
    accountHolder: 'ㅇㅇㅇ',
    paymentPurpose: '강사비 또는 활동비 지급',
  },
  calcInfo: {
    lectureFeeType: 'GRADE_1',
    instructorFeeCalculationUnit: 'PER_HOUR',
    instructorFeeAmount: 450000,
    businessIncomeYn: true,
    educationSessionCount: 3,
    recognizedSessionCount: 1,
    educationStartAt: null,
    educationEndAt: null,
    actualTrainingMinutes: 60,
    totalStudentCount: undefined,
    totalLectureFee: 450000,
  },
  lines: [
    { direction: 'PAYMENT', category: '강사비', amount: 450000 },
    { direction: 'PAYMENT', category: '활동비', amount: 23000 },
    { direction: 'PAYMENT', category: '식사비', amount: 30000 },
    { direction: 'DEDUCTION', category: '원천징수', amount: -14850 },
  ],
  total: { amount: 488150, formulaLabel: '강의비 + 활동비 + 식비 - 원천징수' },
  attachments: [],
}

describe('buildPaymentStatementPreviewOptionsFromApplicationDocument', () => {
  const options = buildPaymentStatementPreviewOptionsFromApplicationDocument({
    document: document14,
    settlementApplicationId: 14,
  })

  it('id=14: 은행·마스킹 계좌·마스킹 주민번호를 응답값 그대로 쓴다', () => {
    expect(options.paymentStatementBasicInfoValues).toMatchObject({
      nameKo: '이순규',
      bankName: '우리',
      accountNumber: '************',
      residentFront: '990909',
      residentBack: '2******',
      accountHolder: 'ㅇㅇㅇ',
    })
  })

  it('affiliation null은 값 없음 그대로 (프로필 소속으로 대체하지 않음)', () => {
    expect(options.paymentStatementBasicInfoValues?.affiliation).toBe('')
    expect(options.paymentStatementBasicInfoValues?.noAffiliation).toBe(false)
  })

  it('PER_HOUR=차시당(기획 B4), 인정 차시=recognizedSessionCount (educationSessionCount 미사용)', () => {
    expect(options.lectureFeeCalculationValues).toMatchObject({
      lectureFeeType: '1급 강사비',
      feeBasisLeft: '차시당',
      feeBasisRight: '450,000원',
      businessIncomeLeft: '해당',
      sessionCount: '1',
      totalLectureFee: '450,000',
    })
  })

  it('recognizedSessionCount null이면 educationSessionCount로 대체하지 않는다', () => {
    const next = buildPaymentStatementPreviewOptionsFromApplicationDocument({
      document: {
        ...document14,
        calcInfo: { ...document14.calcInfo, recognizedSessionCount: null },
      },
      settlementApplicationId: 14,
    })
    expect(next.lectureFeeCalculationValues?.sessionCount).toBe('')
  })

  it('산출 행·수식·합계는 서버 값 그대로 (재계산 없음)', () => {
    const lines = options.paymentStatementCalculationLines
    expect(lines?.formulaLabel).toBe('강의비 + 활동비 + 식비 - 원천징수')
    expect(lines?.totalAmount).toBe(488150)
    expect(lines?.blocks[0]?.lines.map(line => [line.itemLabel, line.amount, line.kind])).toEqual([
      ['강사비', 450000, 'lecture_fee'],
      ['활동비', 23000, 'activity'],
      ['식사비', 30000, 'meal'],
      ['원천징수', -14850, 'withholding'],
    ])
  })

  it('educationStartAt/EndAt null이면 교육 시간을 만들지 않는다', () => {
    expect(options.paymentStatementCalculationLines?.blocks[0]?.lectureDateDisplay).toBe('')
    expect(formatEducationTimeRange(null, '2026-11-07T14:00:00Z')).toBe('')
  })

  it('calculationDetail 없는 행은 basisDetail을 만들지 않는다', () => {
    const lines = options.paymentStatementCalculationLines?.blocks[0]?.lines ?? []
    expect(lines.every(line => line.basisDetail === undefined)).toBe(true)
  })

  it('id=23: BE line.calculationDetail을 산정 기준 상세 basisDetail로 연결한다', () => {
    const next = buildPaymentStatementPreviewOptionsFromApplicationDocument({
      document: {
        ...document14,
        lines: [
          { direction: 'PAYMENT', category: '강사비', amount: 500000, calculationDetail: null },
          {
            direction: 'PAYMENT',
            category: '활동비',
            amount: 23000,
            calculationDetail: {
              layout: 'activity',
              basisJson:
                '{"layout":"activity","itemType":"ACTIVITY","categoryLabel":"활동비","activityFee":{"amountWon":23000},"totalWon":23000}',
              resultAmount: 23000,
            },
          },
          {
            direction: 'PAYMENT',
            category: '식사비',
            amount: 30000,
            calculationDetail: {
              layout: 'meal',
              basisJson:
                '{"layout":"meal","itemType":"MEAL","categoryLabel":"식사비","mealFee":{"amountWon":30000,"receiptFileName":"식사 영수증.jpg","receiptFileObjectId":901},"totalWon":30000}',
              resultAmount: 30000,
            },
          },
          {
            direction: 'DEDUCTION',
            category: '원천징수',
            amount: -16500,
            calculationDetail: {
              layout: 'withholding',
              basisJson:
                '{"taxIncomeType":"BUSINESS_INCOME","rate":0.033,"grossAmount":553000,"taxableAmount":500000,"smallTaxExemptionThreshold":1000,"withholdingTaxAmount":16500}',
              resultAmount: 16500,
              title: '원천세 산출 내역',
              formulaText: '원천징수액 = 과세대상금액 x 세율(0.033), 원 단위 절삭',
            },
          },
        ],
      },
      settlementApplicationId: 23,
    })
    const lines = next.paymentStatementCalculationLines?.blocks[0]?.lines ?? []
    expect(lines[0]?.basisDetail).toBeUndefined()
    expect(lines[1]?.basisDetail).toMatchObject({
      layout: 'activity',
      activityFee: { amountWon: 23000 },
      totalWon: 23000,
    })
    expect(lines[2]?.basisDetail).toMatchObject({
      layout: 'meal',
      mealFee: { amountWon: 30000, receiptFileName: '식사 영수증.jpg', receiptFileObjectId: 901 },
      totalWon: 30000,
    })
    expect(lines[3]?.basisDetail).toMatchObject({
      layout: 'withholdingRate',
      taxIncomeTypeLabel: '사업소득',
      ratePercent: 3.3,
      taxableAmountWon: 500000,
      withholdingTaxAmountWon: 16500,
    })
    // 금액은 서버 값 그대로
    expect(lines.map(line => line.amount)).toEqual([500000, 23000, 30000, -16500])
  })

  it('calcInfo null(영수증 등)이어도 예외 없이 값 없음', () => {
    const next = buildPaymentStatementPreviewOptionsFromApplicationDocument({
      document: { ...document14, calcInfo: null as unknown as undefined },
      settlementApplicationId: 14,
    })
    expect(next.lectureFeeCalculationValues?.feeBasisLeft).toBe('')
    expect(next.lectureFeeCalculationValues?.sessionCount).toBe('')
  })
})

describe('applyApplicationDocumentToProgramCalculationStatement', () => {
  const base: PaymentOrderProgramCalculationStatement = {
    context: 'program',
    sourceLineRowId: 'application:14',
    basic: {
      programName: '일반 프로그램',
      instructorNameKo: '이순규',
      businessPeriodDisplay: '-',
      programSessionProgressDisplay: '4 / 4',
      processingStatusDisplay: '확인 대기 중',
      processingStatusClass: 'pending',
      lectureFeeStandardTitle: '',
      lectureFeeStandardAmount: '',
      businessIncomeEarnerLabel: '',
    },
    blocks: [],
    formulaLabel: '정산 항목 합계',
    totalAmount: 0,
  }

  it('강사비 책정·차시·산출 행·합계를 문서 스냅샷으로 채운다', () => {
    const statement = applyApplicationDocumentToProgramCalculationStatement(base, document14, 14)
    if (statement.context !== 'program') throw new Error('program context expected')
    expect(statement.basic).toMatchObject({
      programName: '일반 프로그램',
      lectureFeeStandardTitle: '1급 강사비 · 차시당',
      lectureFeeStandardAmount: '450,000원',
      businessIncomeEarnerLabel: '해당',
    })
    // 「교육 진행 차시」(인정 차시)는 basic에 두고, 교육 진행 일자 칸 뒤는 회차(시안 「날짜 │ N회차」)
    expect(statement.basic.recognizedSessionCount).toBe(1)
    expect(statement.totalAmount).toBe(488150)
    expect(statement.formulaLabel).toBe('강의비 + 활동비 + 식비 - 원천징수')
  })

  it('교육 진행 일자 칸은 시간 없이 날짜, 뒤는 목록 행 회차(서버 회차 표기가 없을 때)', () => {
    const statement = applyApplicationDocumentToProgramCalculationStatement(
      base,
      {
        ...document14,
        calcInfo: {
          ...document14.calcInfo,
          educationStartAt: '2026-12-08T06:00:00Z',
          educationEndAt: '2026-12-08T08:00:00Z',
        },
      },
      14,
      2
    )
    expect(statement.blocks[0]?.lectureDateDisplay).toBe('2026.12.08(화)')
    expect(statement.blocks[0]?.lectureDateDisplay).not.toMatch(/\d{2}:\d{2}/)
    expect(statement.blocks[0]?.lectureSessionDisplay).toBe('2회차')
  })

  it('확정된 정산 행과 같은 base 날짜·회차가 있으면 그대로 쓰고, 회차가 없으면 날짜만', () => {
    const withBase = applyApplicationDocumentToProgramCalculationStatement(
      {
        ...base,
        blocks: [
          { institutionName: '-', lectureDateDisplay: '2026.11.06(금)', lectureSessionDisplay: '3회차', lines: [] },
        ],
      },
      document14,
      14,
      9
    )
    expect(withBase.blocks[0]).toMatchObject({ lectureDateDisplay: '2026.11.06(금)', lectureSessionDisplay: '3회차' })

    const noSession = applyApplicationDocumentToProgramCalculationStatement(base, document14, 14, null)
    expect(noSession.blocks[0]?.lectureSessionDisplay).toBe('')
  })
})

describe('getSettlementApplicationDocumentErrorMessage', () => {
  it.each([
    [403, '정산 신청서를 조회할 권한 또는 프로그램 접근 범위가 없습니다.'],
    [404, '해당 정산 신청서 또는 revision을 조회할 수 없습니다.'],
    [400, '잘못된 revision 번호입니다.'],
  ])('%i', (status, message) => {
    expect(getSettlementApplicationDocumentErrorMessage({ response: { status } })).toBe(message)
  })
})
