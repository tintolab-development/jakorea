import { describe, expect, it } from 'vitest'
import type { PaymentOrderProgramCalculationStatement } from '@/features/settlement-management/model/payment-order-admin-list'
import {
  buildPaymentStatementIssuanceFileNameFromCalculation,
  buildPaymentStatementIssuancePayloadFromCalculationStatement,
  buildPaymentStatementIssuanceViewOptionsFromCalculation,
  mapInstructorCalculationStatementToIssuanceInput,
} from './payment-order-calculation-statement-issuance-view'

const instructorStatement = (
  overrides: {
    basic?: Partial<Extract<PaymentOrderProgramCalculationStatement, { context: 'instructor' }>['basic']>
  } = {}
): Extract<PaymentOrderProgramCalculationStatement, { context: 'instructor' }> => ({
  context: 'instructor',
  sourceLineRowId: '1001',
  basic: {
    nameKo: '홍길동',
    nameEn: '-',
    phoneDisplay: '-',
    emailDisplay: '-',
    addressDisplay: '-',
    settlementAccountBankNumberPart: '-',
    settlementAccountHolderPart: '-',
    genderBirthDisplay: '-',
    programName: 'JA 경제교실',
    processingStatusDisplay: '확인 완료',
    processingStatusClass: 'confirmed',
    lectureFeeStandardTitle: '2급 강사비',
    lectureFeeStandardAmount: '915,000원',
    businessIncomeEarnerLabel: '해당 없음',
    ...overrides.basic,
  },
  blocks: [
    {
      institutionName: '진월초등학교',
      lectureDateDisplay: '2026.08.15(토)',
      lectureSessionDisplay: '3차시',
      lines: [
        {
          id: '1',
          itemLabel: '강사비',
          description: '강사비 (3차시)',
          amount: 915000,
          kind: 'lecture_fee',
        },
      ],
    },
  ],
  formulaLabel: '정산 항목 합계',
  totalAmount: 915000,
})

describe('지급조서 발급 바인딩 — mock 샘플 금지', () => {
  it('API에 없는 PII는 최강사 샘플로 채우지 않는다', () => {
    const payload = buildPaymentStatementIssuancePayloadFromCalculationStatement(
      instructorStatement()
    )
    expect(payload).not.toBeNull()
    const basic = payload!.paragraphBodyOptions.paymentStatementBasicInfoValues
    const lecture = payload!.paragraphBodyOptions.lectureFeeCalculationValues

    expect(basic?.nameKo).toBe('홍길동')
    expect(basic?.nameEn).toBe('')
    expect(basic?.addressRoad).toBe('')
    expect(basic?.addressDetail).toBe('')
    expect(basic?.bankName).toBe('')
    expect(basic?.accountNumber).toBe('')
    expect(basic?.accountHolder).toBe('')
    expect(basic?.residentFront).toBe('')
    expect(basic?.residentBack).toBe('')
    expect(basic?.affiliation).toBe('')
    expect(basic?.paymentPurpose).toBe('강사비 또는 활동비 지급')

    expect(lecture?.lectureFeeType).toBe('2급 강사비')
    expect(lecture?.feeBasisRight).toBe('기본 : 915,000원')
    expect(lecture?.sessionHours).toBe('')
    expect(lecture?.totalStudents).toBe('')
    expect(lecture?.totalLectureFee).toBe('915,000')
    expect(lecture?.transportFee).toBe(false)
    expect(lecture?.lodgingFee).toBe(false)

    expect(JSON.stringify(payload!.paragraphBodyOptions)).not.toContain('최강사')
    expect(JSON.stringify(payload!.paragraphBodyOptions)).not.toContain('Choi Kang-sa')
    expect(JSON.stringify(payload!.paragraphBodyOptions)).not.toContain('JA빌딩')
    expect(JSON.stringify(payload!.paragraphBodyOptions)).not.toContain('850320')
    expect(JSON.stringify(payload!.paragraphBodyOptions)).not.toContain('3급 강사비')
  })

  it('프로그램 맥락 산출 내역서도 샘플 은행·주소·주민번호를 넣지 않는다', () => {
    const statement: Extract<PaymentOrderProgramCalculationStatement, { context: 'program' }> = {
      context: 'program',
      sourceLineRowId: '2001',
      basic: {
        programName: 'JA 경제교실',
        instructorNameKo: '김민준',
        businessPeriodDisplay: '—',
        programSessionProgressDisplay: '4 / 16',
        processingStatusDisplay: '확인 완료',
        processingStatusClass: 'confirmed',
        lectureFeeStandardTitle: '—',
        lectureFeeStandardAmount: '—',
        businessIncomeEarnerLabel: '—',
      },
      blocks: [
        {
          institutionName: '서울중학교',
          lectureDateDisplay: '2026.08.15(토)',
          lectureSessionDisplay: '2 ~ 3차시',
          lines: [],
        },
      ],
      formulaLabel: '정산 항목 합계',
      totalAmount: 0,
    }

    const payload = buildPaymentStatementIssuancePayloadFromCalculationStatement(statement)
    const basic = payload!.paragraphBodyOptions.paymentStatementBasicInfoValues
    const lecture = payload!.paragraphBodyOptions.lectureFeeCalculationValues

    expect(basic?.nameKo).toBe('김민준')
    expect(basic?.nameEn).toBe('')
    expect(basic?.bankName).toBe('')
    expect(basic?.residentFront).toBe('')
    expect(lecture?.lectureFeeType).toBe('')
    // 교육 진행 차시 = 인정 차시. 프로그램 진행 회차 `4 / 16`의 완료 회차 수(4)를 쓰지 않는다.
    expect(lecture?.sessionCount).toBe('')
    expect(lecture?.totalLectureFee).toBe('')
    expect(lecture?.feeBasisLeft).toBe('')
    expect(JSON.stringify(payload!.paragraphBodyOptions)).not.toContain('최강사')
    expect(JSON.stringify(payload!.paragraphBodyOptions)).not.toContain('240,000')
  })

  it('강사 맥락에서 계좌 placeholder `-` 를 은행명으로 쓰지 않는다', () => {
    const input = mapInstructorCalculationStatementToIssuanceInput(
      instructorStatement({
        basic: {
          settlementAccountBankNumberPart: '-',
          settlementAccountHolderPart: '-',
        },
      })
    )
    expect(input.bankName).toBe('')
    expect(input.accountNumber).toBe('')
    expect(input.accountHolder).toBe('')
  })
})

describe('지급조서 발급 — 회차와 차시 구분', () => {
  const baseInput = mapInstructorCalculationStatementToIssuanceInput(instructorStatement())

  it('교육 진행 차시는 인정 차시(recognizedSessionCount)만 쓴다', () => {
    const options = buildPaymentStatementIssuanceViewOptionsFromCalculation({
      ...baseInput,
      recognizedSessionCount: 2,
    })
    expect(options.lectureFeeCalculationValues?.sessionCount).toBe('2')
  })

  it('인정 차시 0은 0차시로 유지한다', () => {
    const options = buildPaymentStatementIssuanceViewOptionsFromCalculation({
      ...baseInput,
      recognizedSessionCount: 0,
    })
    expect(options.lectureFeeCalculationValues?.sessionCount).toBe('0')
  })

  it('파일명은 일정 칸 원문 단위(차시/회차)를 그대로 쓴다', () => {
    const withSession = (lectureSessionDisplay: string) =>
      buildPaymentStatementIssuanceFileNameFromCalculation({
        ...baseInput,
        blocks: baseInput.blocks.map(block => ({ ...block, lectureSessionDisplay })),
      })
    expect(withSession('3차시')).toMatch(/_3차시$/)
    expect(withSession('2 ~ 3차시')).toMatch(/_2-3차시$/)
    expect(withSession('2026-08-15 09:00~10:00 · 1회차')).toMatch(/_1회차$/)
  })
})
