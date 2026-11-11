import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  applyInstructorMemberPiiToAccountPaymentDetail,
  applyMaskedInstructorMemberToAccountPaymentDetail,
  mapAccountPaymentDetailFromGetApi,
  resolveAccountPaymentMemberId,
} from '@/features/settlement-management/api/account-payments/map-account-payment-detail'
import {
  buildPaymentStatementIssuanceViewOptionsFromCalculation,
  mapAccountPaymentStatusDetailToIssuanceInput,
} from '@/features/settlement/lib/payment-order-calculation-statement-issuance-view'
import type {
  AccountPaymentRow,
  AccountPaymentStatusDetail,
} from '@/features/settlement-management/model/account-payments-list'
import type { InstructorMemberDetailResponse } from '@/shared/api/generated/members/schemas'
import type {
  AccountPaymentDetailResponse,
  SettlementFrontendResponse,
} from '@/shared/api/generated/settlement/schemas'

const baseRow: AccountPaymentRow = {
  id: '185956',
  accountPaymentId: 185956,
  settlementId: undefined,
  instructorMemberId: 190001,
  no: 1,
  instructorName: '이건희',
  programName: '-',
  institutionName: '-',
  sessionLabel: '-',
  accountPaymentStatus: 'awaiting_confirmation',
  amount: 100_000,
  transferScheduledDate: '2026-10-15',
  paymentOrderStatus: 'confirmed',
}

function emptyDetailBasic(): AccountPaymentStatusDetail {
  return {
    basic: {
      nameKo: '이건희',
      nameEn: '-',
      genderBirthDisplay: '-',
      phoneDisplay: '-',
      emailDisplay: '-',
      addressDisplay: '-',
      settlementAccountBankNumberPart: '국민은행 ****',
      settlementAccountHolderPart: '이건희',
      programName: '-',
      programSessionProgressDisplay: '-',
      businessPeriodDisplay: '-',
      accountPaymentStatus: 'awaiting_confirmation',
      accountPaymentStatusLabel: '확인 대기 중',
      transferScheduledDateDisplay: '-',
      paidAtDisplay: '-',
      lectureFeeStandardTitle: '-',
      lectureFeeStandardAmount: '-',
      businessIncomeEarnerLabel: '해당 없음',
    },
    blocks: [],
    formulaLabel: '정산 항목 합계',
    totalAmount: 100_000,
    plainAccountForPaymentConfirm: {
      bankAndNumber: '국민은행 ****',
      holder: '이건희',
    },
  }
}

describe('resolveAccountPaymentMemberId', () => {
  it('payment.memberId를 우선한다', () => {
    const detail: AccountPaymentDetailResponse = {
      payment: { memberId: 190001, instructorName: '이건희' },
      settlement: { instructorId: '999' } as SettlementFrontendResponse,
    }
    expect(resolveAccountPaymentMemberId(detail, baseRow)).toBe(190001)
  })

  it('payment.memberId 없으면 settlement.instructorId를 쓴다', () => {
    const detail: AccountPaymentDetailResponse = {
      payment: { instructorName: '이건희' },
      settlement: { instructorId: '190001' } as SettlementFrontendResponse,
    }
    expect(
      resolveAccountPaymentMemberId(detail, { ...baseRow, instructorMemberId: undefined })
    ).toBe(190001)
  })

  it('둘 다 없으면 row.instructorMemberId를 쓴다', () => {
    const detail: AccountPaymentDetailResponse = {
      payment: { instructorName: '이건희' },
    }
    expect(resolveAccountPaymentMemberId(detail, baseRow)).toBe(190001)
  })
})

describe('applyInstructorMemberPiiToAccountPaymentDetail', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-02T12:00:00+09:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('마스킹 PII를 -로 치환하지 않는다', () => {
    const instructor: InstructorMemberDetailResponse = {
      member: {
        memberId: 190001,
        name: '이건희',
        gender: '*',
        birthDate: undefined,
        birthYear: 1994,
        phone: '010-****-5425',
        email: 'teacher.instruc***@test.com',
      },
      profile: {
        homeAddress: { line: '서울특별시 강서구', detail: '마스킹' },
      },
    }

    const mapped = applyInstructorMemberPiiToAccountPaymentDetail(emptyDetailBasic(), instructor)

    expect(mapped.basic.genderBirthDisplay).toBe('** | 1994.**.**')
    expect(mapped.basic.phoneDisplay).toBe('010-****-5425')
    expect(mapped.basic.emailDisplay).toBe('teacher.instruc***@test.com')
    expect(mapped.basic.addressDisplay).toBe('서울특별시 강서구 마스킹')
  })

  it('회원 상세 원문은 마스킹하고 계좌 칸은 유지한다', () => {
    const instructor: InstructorMemberDetailResponse = {
      member: {
        memberId: 190001,
        name: '이건희',
        gender: 'M',
        birthDate: '1994-03-02',
        phone: '010-1234-5425',
        email: 'teacher.instruct@test.com',
      },
      profile: {
        homeAddress: { line: '서울특별시 강서구 화곡동 12', detail: '101호' },
      },
    }
    const mapped = applyMaskedInstructorMemberToAccountPaymentDetail(emptyDetailBasic(), instructor)
    expect(mapped.basic.genderBirthDisplay).toBe('** | 1994.**.**')
    expect(mapped.basic.phoneDisplay).toBe('010-****-5425')
    expect(mapped.basic.emailDisplay).toContain('***@')
    expect(mapped.basic.addressDisplay).not.toContain('101호')
    expect(mapped.basic.settlementAccountBankNumberPart).toBe('국민은행 ****')
  })

  it('instructor 없으면 PII를 -로 유지한다', () => {
    const mapped = applyInstructorMemberPiiToAccountPaymentDetail(emptyDetailBasic(), null)
    expect(mapped.basic.genderBirthDisplay).toBe('-')
    expect(mapped.basic.phoneDisplay).toBe('-')
    expect(mapped.basic.emailDisplay).toBe('-')
    expect(mapped.basic.addressDisplay).toBe('-')
  })
})

describe('mapAccountPaymentDetailFromGetApi', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-02T12:00:00+09:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('상세 표시 계좌는 sensitiveAccount 원문(권한 설정 V1.1 상세 계좌번호 기본 노출)', () => {
    const detail: AccountPaymentDetailResponse = {
      payment: {
        accountPaymentId: 185956,
        memberId: 190001,
        instructorName: '이건희',
        sourceType: 'GEMINI_TRAINING_REPORT',
        netPaymentAmount: 100_000,
        scheduledPaymentDate: '2026-10-15',
        paidAt: '2026-10-15T15:00:00.000Z',
        paymentStatus: 'PAID',
        bankName: '국민은행',
        maskedAccountNo: '**********',
        accountHolder: '이*희',
      },
      settlement: {
        id: '190001',
        instructorId: '190001',
        instructorName: '이건희',
        institutionName: '서울 성동고등학교',
        lectureSessionDisplay: '10:00 ~ 17:00',
        programNameKo: '찾아가는 연수',
        businessPeriodStart: '2026-01-01',
        businessPeriodEnd: '2026-12-31',
        period: '2026-11',
        items: [{ type: 'instructor_fee', amount: 100_000, description: '강사비' }],
        totalAmount: 100_000,
      },
      sensitiveAccount: {
        bankName: '국민은행',
        accountNo: '1234567890',
        accountHolder: '이건희',
      },
    }

    const mapped = mapAccountPaymentDetailFromGetApi(baseRow, detail)

    expect(mapped.basic.nameKo).toBe('이건희')
    expect(mapped.basic.settlementAccountBankNumberPart).toBe('국민은행 1234567890')
    expect(mapped.basic.settlementAccountHolderPart).toBe('이건희')
    expect(mapped.plainAccountForPaymentConfirm?.bankAndNumber).toContain('1234567890')
    expect(mapped.plainAccountForPaymentConfirm?.holder).toBe('이건희')
    expect(mapped.blocks[0]?.institutionName).toBe('서울 성동고등학교')
    expect(mapped.totalAmount).toBe(100_000)
    expect(mapped.basic.paidAtDisplay).toBe('2026.10.16(금)')
    expect(mapped.basic.businessPeriodDisplay).toContain('2026.01.01')
    expect(mapped.basic.businessPeriodDisplay).toContain('2026.12.31')
    expect(mapped.basic.businessPeriodDisplay).not.toBe('2026-11')
    expect(mapped.blocks[0]?.lines[0]?.basisDetail).toBeUndefined()
  })

  it('settlement.payee MASKED를 성별·연락처 칸에 매핑한다', () => {
    const detail: AccountPaymentDetailResponse = {
      payment: {
        accountPaymentId: 185956,
        instructorName: '이건희',
        bankName: '국민',
        maskedAccountNo: '**************',
        accountHolder: '[**산',
        paymentStatus: 'WAITING_PAYMENT',
      },
      settlement: {
        id: '185956',
        items: [],
        totalAmount: 0,
        payee: {
          gender: '**',
          birthDate: '1985-**-**',
          phone: '010-****-2201',
          email: 'e2e-settle-***@local.demo',
          addressRoad: '서울특별시 강남구 테헤란로 *****',
          addressDetail: '***',
          accountHolder: '[E2E-SETTLE] 김정산',
        },
      },
      sensitiveAccount: {
        bankName: '국민',
        accountNo: '11048200123456',
        accountHolder: '[E2E-SETTLE] 김정산',
      },
    }

    const mapped = mapAccountPaymentDetailFromGetApi(baseRow, detail)
    expect(mapped.basic.genderBirthDisplay).toBe('** | 1985.**.**')
    expect(mapped.basic.phoneDisplay).toBe('010-****-2201')
    expect(mapped.basic.emailDisplay).toBe('e2e-settle-***@local.demo')
    expect(mapped.basic.addressDisplay).toBe('서울특별시 강남구 테헤란로 ***** ***')
    expect(mapped.basic.settlementAccountBankNumberPart).toBe('국민 11048200123456')
    // sensitive 원문 `[E2E-SETTLE] 김정산` → 접두어만 제거
    expect(mapped.basic.settlementAccountHolderPart).toBe('김정산')
    expect(mapped.plainAccountForPaymentConfirm?.holder).toBe('[E2E-SETTLE] 김정산')
  })

  it('제미나이 일정 칸은 lectureSessionDisplay 시계열을 유지하고 모달 인정 차시는 calculationDetail', () => {
    const detail: AccountPaymentDetailResponse = {
      payment: {
        accountPaymentId: 185986,
        memberId: 190031,
        instructorName: '강하늘',
        sourceType: 'GEMINI_TRAINING_REPORT',
        netPaymentAmount: 170_000,
        sessionOrdinal: 2,
        sessionLabel: '2차시',
        paymentStatus: 'PAID',
      },
      settlement: {
        id: '185986',
        wageItemType: 'GEMINI',
        lectureFeeStandardTitle: '제미나이 강사비',
        lectureFeeStandardAmount: 170_000,
        sessionOrdinal: 2,
        lectureSessionDisplay: '14:30 ~ 16:30',
        institutionName: '왕남초등학교',
        programNameKo: '이건희',
        items: [
          {
            type: 'instructor_fee',
            description: '제미나이 강사비',
            amount: 170_000,
            calculationDetail: {
              layout: 'lectureFeeGemini',
              title: '강사비 산정 기준 상세',
              resultAmount: 170_000,
              basisJson: JSON.stringify({
                layout: 'lectureFeeGemini',
                itemType: 'LECTURE_FEE',
                wageItemType: 'GEMINI',
                categoryLabel: '제미나이 강사비',
                feeAssessmentWon: 170_000,
                amount: 170_000,
                sessionOrdinal: 2,
                lectureTimeDisplay: '2차시',
              }),
            },
          },
        ],
        totalAmount: 170_000,
      },
    }

    const mapped = mapAccountPaymentDetailFromGetApi(
      { ...baseRow, id: '185986', accountPaymentId: 185986 },
      detail
    )
    const line = mapped.blocks[0]?.lines[0]
    expect(mapped.blocks[0]?.lectureSessionDisplay).toBe('14:30 ~ 16:30')
    expect(line?.basisDetail?.layout).toBe('lectureFeeGemini')
    if (line?.basisDetail?.layout !== 'lectureFeeGemini') return
    expect(line.basisDetail.lectureTimeDisplay).toBe('2차시')
    expect(line.basisDetail.feeAssessmentWon).toBe(170_000)
    expect(line.basisDetail.categoryLabel).toBe('제미나이 강사비')
  })

  it('BE N3·N5 — Gemini 상세(AP-…): 진행 회차 null은 「-」, 인정 차시는 recognizedSessionCount, basisJson에 sessionOrdinal 없음', () => {
    const settlement = {
      id: 'AP-77',
      wageItemType: 'GEMINI',
      lectureFeeStandardTitle: '세미나이 강사비',
      lectureFeeStandardAmount: 170_000,
      sessionOrdinal: null,
      sessionCompleted: null,
      sessionTotal: null,
      programSessionProgressDisplay: null,
      recognizedSessionCount: 2,
      lectureSessionDisplay: '2차시',
      items: [
        {
          type: 'instructor_fee',
          description: '프로그램 2차시 강사비 (세미나이 강사비)',
          amount: 170_000,
          calculationDetail: {
            layout: 'lectureFeeTier',
            title: '강사비 산정 기준 상세',
            resultAmount: 170_000,
            basisJson: JSON.stringify({
              layout: 'lectureFeeTier',
              itemType: 'LECTURE_FEE',
              wageItemType: 'GEMINI',
              categoryLabel: '세미나이 강사비',
              feeAssessmentWon: 170_000,
              amount: 170_000,
              lectureTimeDisplay: '2차시',
            }),
          },
        },
      ],
      totalAmount: 170_000,
    } as unknown as SettlementFrontendResponse
    const detail: AccountPaymentDetailResponse = {
      payment: {
        accountPaymentId: 77,
        memberId: 190031,
        instructorName: '강하늘',
        sourceType: 'GEMINI_TRAINING_REPORT',
        netPaymentAmount: 170_000,
        sessionOrdinal: null,
        sessionLabel: '2차시',
        paymentStatus: 'PAID',
      },
      settlement,
    }

    const mapped = mapAccountPaymentDetailFromGetApi(
      { ...baseRow, id: '77', accountPaymentId: 77, sessionLabel: '2차시' },
      detail
    )

    expect(mapped.basic.programSessionProgressDisplay).toBe('-')
    expect(mapped.basic.recognizedSessionCount).toBe(2)
    expect(mapped.blocks[0]?.lectureSessionDisplay).toBe('2차시')
    const line = mapped.blocks[0]?.lines[0]
    expect(line?.basisDetail?.layout).toBe('lectureFeeGemini')
    if (line?.basisDetail?.layout === 'lectureFeeGemini') {
      expect(line.basisDetail.lectureTimeDisplay).toBe('2차시')
    }

    const issuance = buildPaymentStatementIssuanceViewOptionsFromCalculation(
      mapAccountPaymentStatusDetailToIssuanceInput(mapped)
    )
    expect(issuance.lectureFeeCalculationValues?.sessionCount).toBe('2')
  })

  it('recognizedSessionCount가 없는 예전 정산은 지급조서 교육 진행 차시를 빈칸으로 둔다', () => {
    const detail: AccountPaymentDetailResponse = {
      payment: { accountPaymentId: 78, instructorName: '강하늘', paymentStatus: 'PAID' },
      settlement: {
        id: '1694926',
        sessionOrdinal: 3,
        sessionCompleted: 2,
        sessionTotal: 5,
        programSessionProgressDisplay: '2 / 5',
        items: [],
      },
    }

    const mapped = mapAccountPaymentDetailFromGetApi(
      { ...baseRow, id: '78', accountPaymentId: 78 },
      detail
    )

    expect(mapped.basic.programSessionProgressDisplay).toBe('2 / 5')
    expect(mapped.basic.recognizedSessionCount).toBeNull()
    const issuance = buildPaymentStatementIssuanceViewOptionsFromCalculation(
      mapAccountPaymentStatusDetailToIssuanceInput(mapped)
    )
    // 진행 회차 `2 / 5`의 2나 회차 번호 3으로 채우지 않는다.
    expect(issuance.lectureFeeCalculationValues?.sessionCount).toBe('')
  })

  it('미지급 상태에서는 paidAt가 있어도 이체 완료일을 -로 표시한다', () => {
    const detail: AccountPaymentDetailResponse = {
      payment: {
        accountPaymentId: 185956,
        instructorName: '이건희',
        paymentStatus: 'WAITING_PAYMENT',
        paidAt: '2026-10-15T15:00:00.000Z',
      },
    }

    const mapped = mapAccountPaymentDetailFromGetApi(
      { ...baseRow, paidAt: '2026-10-15T15:00:00.000Z' },
      detail
    )

    expect(mapped.basic.paidAtDisplay).toBe('-')
  })

  it('settlement가 없어도 강사 unmask로 성별·연락처를 채우지 않는다', () => {
    const detail: AccountPaymentDetailResponse = {
      payment: {
        accountPaymentId: 185956,
        memberId: 190001,
        instructorName: '이건희',
        sourceType: 'GEMINI_TRAINING_REPORT',
        netPaymentAmount: 50_000,
      },
      settlement: undefined,
      sensitiveAccount: {
        bankName: '국민은행',
        accountHolder: '이건희',
      },
    }

    const mapped = mapAccountPaymentDetailFromGetApi(baseRow, detail)

    expect(mapped.basic.genderBirthDisplay).toBe('-')
    expect(mapped.basic.phoneDisplay).toBe('-')
    expect(mapped.basic.emailDisplay).toBe('-')
    expect(mapped.basic.addressDisplay).toBe('-')
    // sensitiveAccount 예금주 원문은 Master·Accounting Manager에게만 내려온다 → 상세에 원문 표시
    expect(mapped.basic.settlementAccountHolderPart).toBe('이건희')
  })

  it('settlement가 없으면 프로그램 진행 회차를 차시 라벨(sessionLabel)로 채우지 않는다', () => {
    const detail: AccountPaymentDetailResponse = {
      payment: {
        accountPaymentId: 185956,
        memberId: 190001,
        instructorName: '이건희',
        sourceType: 'GEMINI_TRAINING_REPORT',
        sessionLabel: '2차시',
        netPaymentAmount: 50_000,
      },
      settlement: undefined,
    }

    const mapped = mapAccountPaymentDetailFromGetApi({ ...baseRow, sessionLabel: '2차시' }, detail)

    expect(mapped.basic.programSessionProgressDisplay).toBe('-')
    // 일정 칸에는 차시 라벨 원문 유지
    expect(mapped.blocks[0]?.lectureSessionDisplay).toBe('2차시')
  })

  it('sensitiveAccount.accountNo가 없으면 강사 계좌 원문으로 보완하지 않는다', () => {
    const detail: AccountPaymentDetailResponse = {
      payment: {
        accountPaymentId: 185956,
        memberId: 190001,
        instructorName: '이건희',
        bankName: '국민은행',
        accountHolder: '이건희',
      },
      sensitiveAccount: {
        bankName: '국민은행',
        accountHolder: '이건희',
      },
    }

    const mapped = mapAccountPaymentDetailFromGetApi(baseRow, detail)

    expect(mapped.basic.settlementAccountBankNumberPart).toBe('국민은행')
    // sensitiveAccount 예금주 원문은 Master·Accounting Manager에게만 내려온다 → 상세에 원문 표시
    expect(mapped.basic.settlementAccountHolderPart).toBe('이건희')
  })

  it('상세 응답 programType을 모델에 싣는다(개인형 참여 기관명 열 판정용)', () => {
    const detail = {
      payment: { accountPaymentId: 185956, instructorName: '이건희', programId: 186564 },
      settlement: { id: '185956', programId: 186564, items: [], totalAmount: 0 },
      programType: 'GENERAL_INDIVIDUAL',
      // programType은 명세 미반영 필드라 생성 타입에 없다 — 서버 응답 그대로 검증한다.
    } as unknown as AccountPaymentDetailResponse

    const mapped = mapAccountPaymentDetailFromGetApi(baseRow, detail)
    expect(mapped.programType).toBe('GENERAL_INDIVIDUAL')
    expect(mapped.programId).toBe('186564')
  })

  it('programType을 주지 않는 이전 응답은 undefined', () => {
    const detail: AccountPaymentDetailResponse = {
      payment: { accountPaymentId: 185956, instructorName: '이건희' },
    }
    expect(mapAccountPaymentDetailFromGetApi(baseRow, detail).programType).toBeUndefined()
  })

  it('영수증 지급 건: 실비 항목만 순서대로, 강사비·원천징수 행 없음, 강사 전용 값은 -, 첨부 담기 (E3)', () => {
    const detail = {
      payment: {
        accountPaymentId: 601,
        instructorName: '김봉사',
        netPaymentAmount: 45000,
        paymentStatus: 'WAITING_PAYMENT',
        sourceType: 'INDIVIDUAL_SETTLEMENT',
        payeeType: 'VOLUNTEER',
      },
      settlement: {
        instructorName: '김봉사',
        totalAmount: 45000,
        lectureFeeStandardTitle: null,
        lectureFeeStandardAmount: null,
        businessIncomeEarnerLabel: '해당 없음',
        lectureSessionDisplay: '09:00 ~ 12:00',
        items: [
          { type: 'meal', amount: 10000 },
          { type: 'transportation', amount: 20000 },
          { type: 'activity', amount: 15000 },
        ],
        attachments: [
          { fileObjectId: 77, fileName: 'meal.jpg', itemType: 'MEAL', applicationItemId: 3 },
          { fileName: 'no-id.jpg' },
        ],
      },
    } as unknown as Parameters<typeof mapAccountPaymentDetailFromGetApi>[1]
    const mapped = mapAccountPaymentDetailFromGetApi(baseRow, detail)
    const kinds = mapped.blocks[0]?.lines.map(line => line.kind)
    expect(kinds).toEqual(['travel', 'activity', 'meal'])
    expect(mapped.totalAmount).toBe(45000)
    expect(mapped.basic.lectureFeeStandardTitle).toBe('-')
    expect(mapped.basic.lectureFeeStandardAmount).toBe('-')
    expect(mapped.basic.businessIncomeEarnerLabel).toBe('-')
    expect(mapped.isReceiptPayment).toBe(true)
    expect(mapped.receiptAttachments).toEqual([
      { fileObjectId: 77, fileName: 'meal.jpg', itemType: 'MEAL', applicationItemId: 3 },
    ])
  })

  it('영수증 건은 실비 항목이 없어도 강사비 대체 행을 만들지 않는다', () => {
    const detail = {
      payment: { accountPaymentId: 602, sourceType: 'INDIVIDUAL_SETTLEMENT', payeeType: 'PARTICIPANT' },
      settlement: { totalAmount: 0, items: [] },
    } as unknown as Parameters<typeof mapAccountPaymentDetailFromGetApi>[1]
    const mapped = mapAccountPaymentDetailFromGetApi(baseRow, detail)
    expect(mapped.blocks[0]?.lines).toEqual([])
  })
})
