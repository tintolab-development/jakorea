import { describe, expect, it } from 'vitest'
import {
  formatInstructorSettlementAccountParts,
  instructorBankLine,
} from '@/features/user/detail/ui/user-basic-info/display'
import type { User } from '@/types/user'

function instructor(partial: Partial<Omit<User, 'password'>>): Omit<User, 'password'> {
  return {
    id: 'u1',
    email: 'a@b.c',
    name: '박틴토',
    role: 'INSTRUCTOR',
    isActive: true,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    ...partial,
  }
}

describe('formatInstructorSettlementAccountParts', () => {
  it('마스킹 시 은행명 원문 · 계좌 전체 마스킹 · 예금주 성과 마지막 글자', () => {
    const user = instructor({
      instructorInfo: {
        bankName: '농협',
        accountNumber: '123456-12-123456',
        accountHolder: '박틴토',
        isBusinessIncome: false,
      },
    })
    expect(instructorBankLine(user, false)).toBe('농협 ******-**-****** | 박*토')
  })

  it('개인정보 확인 시에는 원문을 노출한다', () => {
    const user = instructor({
      instructorInfo: {
        bankName: '농협',
        accountNumber: '123456-12-123456',
        accountHolder: '박틴토',
        isBusinessIncome: false,
      },
    })
    expect(instructorBankLine(user, true)).toBe('농협 123456-12-123456 | 박틴토')
  })

  it('계좌가 없으면 빈 문자열이 아니라 - 를 보여 준다', () => {
    const user = instructor({
      instructorInfo: {
        bankName: '',
        accountNumber: '',
        accountHolder: '',
        isBusinessIncome: false,
      },
    })
    expect(instructorBankLine(user, false)).toBe('-')
    expect(instructorBankLine(user, true)).toBe('-')
  })

  it('복성 예금주는 앞 2글자와 마지막 글자를 남긴다', () => {
    const parts = formatInstructorSettlementAccountParts({
      bankName: '신한',
      accountNumber: '110',
      accountHolder: '남궁민수',
    })
    expect(parts).toEqual({
      left: '신한 ***',
      holder: '남궁*수',
    })
  })
})
