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
  it('마스킹 시 스크린샷 형식: 은행명 원문 · 계좌 전체 마스킹 · 예금주 성만', () => {
    const user = instructor({
      instructorInfo: {
        bankName: '농협',
        accountNumber: '123456-12-123456',
        accountHolder: '박틴토',
        isBusinessIncome: false,
      },
    })
    expect(instructorBankLine(user, false)).toBe('농협 ******-**-****** | 박**')
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

  it('복성 예금주는 앞 2글자를 성으로 노출한다', () => {
    const parts = formatInstructorSettlementAccountParts({
      bankName: '신한',
      accountNumber: '110',
      accountHolder: '남궁민수',
    })
    expect(parts).toEqual({
      left: '신한 ***',
      holder: '남궁**',
    })
  })
})
