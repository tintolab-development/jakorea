import { describe, expect, it } from 'vitest'
import {
  applyInstructorMemberPiiToAccountPaymentDetail,
  mapAccountPaymentDetailFromGetApi,
  resolveAccountPaymentMemberId,
} from '@/features/settlement-management/api/account-payments/map-account-payment-detail'
import type { AccountPaymentRow, AccountPaymentStatusDetail } from '@/features/settlement-management/model/account-payments-list'
import type { InstructorMemberDetailResponse } from '@/shared/api/generated/members/schemas'
import type { AccountPaymentDetailResponse } from '@/shared/api/generated/settlement/schemas'

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
      settlement: { instructorId: '999' },
    }
    expect(resolveAccountPaymentMemberId(detail, baseRow)).toBe(190001)
  })

  it('payment.memberId 없으면 settlement.instructorId를 쓴다', () => {
    const detail: AccountPaymentDetailResponse = {
      payment: { instructorName: '이건희' },
      settlement: { instructorId: '190001' },
    }
    expect(resolveAccountPaymentMemberId(detail, { ...baseRow, instructorMemberId: undefined })).toBe(
      190001
    )
  })

  it('둘 다 없으면 row.instructorMemberId를 쓴다', () => {
    const detail: AccountPaymentDetailResponse = {
      payment: { instructorName: '이건희' },
    }
    expect(resolveAccountPaymentMemberId(detail, baseRow)).toBe(190001)
  })
})

describe('applyInstructorMemberPiiToAccountPaymentDetail', () => {
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

    expect(mapped.basic.genderBirthDisplay).toBe('** | 1994. **. **')
    expect(mapped.basic.phoneDisplay).toBe('010-****-5425')
    expect(mapped.basic.emailDisplay).toBe('teacher.instruc***@test.com')
    expect(mapped.basic.addressDisplay).toBe('서울특별시 강서구 마스킹')
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
  it('settlement embed + sensitiveAccount + instructor PII를 compose한다', () => {
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
      },
      settlement: {
        instructorId: '190001',
        instructorName: '이건희',
        institutionName: '서울 성동고등학교',
        lectureSessionDisplay: '10:00 ~ 17:00',
        programNameKo: '찾아가는 연수',
        items: [{ type: 'instructor_fee', amount: 100_000, description: '강의비' }],
        totalAmount: 100_000,
      },
      sensitiveAccount: {
        bankName: '국민은행',
        accountNo: '1234567890',
        accountHolder: '이건희',
      },
    }

    const instructor: InstructorMemberDetailResponse = {
      member: {
        gender: '*',
        birthYear: 1994,
        phone: '010-****-5425',
        email: 'teacher.instruc***@test.com',
      },
      profile: {
        homeAddress: { line: '서울특별시 강서구', detail: '마스킹' },
      },
    }

    const mapped = mapAccountPaymentDetailFromGetApi(baseRow, detail, instructor)

    expect(mapped.basic.nameKo).toBe('이건희')
    expect(mapped.basic.genderBirthDisplay).not.toBe('-')
    expect(mapped.basic.phoneDisplay).toBe('010-****-5425')
    expect(mapped.basic.emailDisplay).toBe('teacher.instruc***@test.com')
    expect(mapped.basic.addressDisplay).toBe('서울특별시 강서구 마스킹')
    expect(mapped.basic.settlementAccountBankNumberPart).toContain('국민은행')
    expect(mapped.basic.settlementAccountHolderPart).toBe('이건희')
    expect(mapped.blocks[0]?.institutionName).toBe('서울 성동고등학교')
    expect(mapped.totalAmount).toBe(100_000)
    expect(mapped.basic.paidAtDisplay).toBe('2026. 10. 16(금)')
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
      detail,
      null
    )

    expect(mapped.basic.paidAtDisplay).toBe('-')
  })

  it('settlement == null이어도 instructor PII는 채운다', () => {
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

    const instructor: InstructorMemberDetailResponse = {
      member: {
        gender: 'M',
        birthDate: '1994-07-22',
        phone: '010-1234-5678',
        email: 'a@test.com',
      },
      profile: {
        homeAddress: { line: '서울시 중구' },
      },
    }

    const mapped = mapAccountPaymentDetailFromGetApi(baseRow, detail, instructor)

    expect(mapped.basic.genderBirthDisplay).toBe('남성 | 1994. 07. 22')
    expect(mapped.basic.phoneDisplay).toBe('010-1234-5678')
    expect(mapped.basic.emailDisplay).toBe('a@test.com')
    expect(mapped.basic.addressDisplay).toBe('서울시 중구')
    expect(mapped.basic.settlementAccountHolderPart).toBe('이건희')
  })

  it('sensitiveAccount.accountNo가 없으면 instructor settlement 계좌번호로 보완한다', () => {
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

    const instructor: InstructorMemberDetailResponse = {
      member: { name: '이건희' },
      settlement: {
        bankName: '국민은행',
        accountNumber: '123456789012',
        accountHolder: '이건희',
      },
    }

    const mapped = mapAccountPaymentDetailFromGetApi(baseRow, detail, instructor)

    expect(mapped.basic.settlementAccountBankNumberPart).toBe('국민은행 123456789012')
    expect(mapped.basic.settlementAccountHolderPart).toBe('이건희')
  })
})
