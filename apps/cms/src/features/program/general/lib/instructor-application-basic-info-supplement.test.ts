import { describe, expect, it } from 'vitest'
import {
  affiliationDisplayFromInstructorCmsProfile,
  readInstructorApplicationSettlementFields,
  retainMaskedInstructorApplicationSettlement,
} from './instructor-application-basic-info-supplement'
import type { InstructorApplicationDetailResponse } from '@/shared/api/generated/dashboard/schemas/instructorApplicationDetailResponse'

describe('instructor-application-basic-info-supplement', () => {
  it('formats affiliation from cms profile school and organization names', () => {
    expect(
      affiliationDisplayFromInstructorCmsProfile({
        affiliation: {
          schoolName: '테스트초',
          organizationNames: ['기관 A', '기관 B'],
        },
      })
    ).toBe('테스트초, 기관 A, 기관 B')
  })
})

describe('readInstructorApplicationSettlementFields', () => {
  it('서버 마스킹 값을 그대로 읽고 businessIncomeEarnerStatus는 응답 문자열만 쓴다', () => {
    const fields = readInstructorApplicationSettlementFields({
      settlement: {
        bankName: '우리',
        accountNumber: '************',
        accountHolder: '이*규',
        businessIncome: true,
      },
      businessIncomeEarnerStatus: '해당 없음',
    })
    expect(fields).toEqual({
      bankName: '우리',
      accountNumber: '************',
      accountHolder: '이*규',
      settlementBusinessIncome: true,
      businessIncomeEarnerStatus: '해당 없음',
    })
  })

  it.each<[string, InstructorApplicationDetailResponse]>([
    ['settlement null', { settlement: null, businessIncomeEarnerStatus: null }],
    ['settlement 생략', {}],
    ['내부 필드 생략', { settlement: {} }],
    [
      '내부 필드 null',
      {
        settlement: { bankName: null, accountNumber: null, accountHolder: null, businessIncome: null },
      },
    ],
    ['빈 문자열', { settlement: { bankName: '', accountNumber: ' ', accountHolder: '' } }],
  ])('%s → 값 없음 (placeholder·기본값 미생성)', (_label, dto) => {
    expect(readInstructorApplicationSettlementFields(dto)).toEqual({})
  })

  it('settlement.businessIncome으로 사업소득자 여부를 계산하지 않는다', () => {
    const fields = readInstructorApplicationSettlementFields({
      settlement: { businessIncome: true },
      businessIncomeEarnerStatus: null,
    })
    expect(fields.businessIncomeEarnerStatus).toBeUndefined()
    expect(fields.settlementBusinessIncome).toBe(true)
  })

  it('허용되지 않은 문자열은 사업소득자 여부로 쓰지 않는다', () => {
    expect(
      readInstructorApplicationSettlementFields({ businessIncomeEarnerStatus: 'Y' })
        .businessIncomeEarnerStatus
    ).toBeUndefined()
  })
})

describe('retainMaskedInstructorApplicationSettlement', () => {
  const previous: InstructorApplicationDetailResponse = {
    settlement: { bankName: '우리', accountNumber: '***-****', accountHolder: '이*규' },
  }

  it('원문 응답에 계좌 값이 있으면 그대로 쓴다', () => {
    const projected = {
      settlement: { bankName: '우리', accountNumber: '123-4567', accountHolder: '이순규' },
    }
    expect(retainMaskedInstructorApplicationSettlement(projected, previous)).toBe(projected)
  })

  it('projection으로 계좌 필드가 제거되면 직전 서버 마스킹 값을 유지한다', () => {
    const projected = { settlement: { bankName: '우리' } }
    expect(retainMaskedInstructorApplicationSettlement(projected, previous).settlement).toEqual({
      bankName: '우리',
      accountNumber: '***-****',
      accountHolder: '이*규',
    })
  })

  it('직전 값이 마스킹되지 않았으면 가져오지 않는다', () => {
    const projected = { settlement: { bankName: '우리' } }
    expect(
      retainMaskedInstructorApplicationSettlement(projected, {
        settlement: { accountNumber: '123-4567', accountHolder: '이순규' },
      })
    ).toBe(projected)
  })
})
