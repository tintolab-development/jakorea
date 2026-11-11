import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  applyInstructorMemberPiiToAccountPaymentDetail,
  applyMaskedInstructorMemberToAccountPaymentDetail,
  mapAccountPaymentDetailFromGetApi,
  resolveAccountPaymentMemberId,
} from '@/features/settlement-management/api/account-payments/map-account-payment-detail'
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
})
