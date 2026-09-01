import { describe, expect, it } from 'vitest'
import { stripRestrictedPiiForRole } from './strip-restricted-pii'
import type { User } from '@/types/user'

const previous: Omit<User, 'password'> = {
  id: 'u1',
  email: 'a@b.c',
  name: '강사',
  role: 'INSTRUCTOR',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  instructorInfo: {
    bankName: '농협',
    accountNumber: '***********',
    accountHolder: '박**',
    isBusinessIncome: false,
  },
}

const merged: Omit<User, 'password'> = {
  ...previous,
  instructorInfo: {
    bankName: '농협',
    accountNumber: '1002-859-723089',
    accountHolder: '박강사',
    isBusinessIncome: false,
  },
}

describe('stripRestrictedPiiForRole', () => {
  it('마스터·PM은 계좌 원문을 유지한다', () => {
    expect(stripRestrictedPiiForRole(merged, previous, 'MASTER').instructorInfo?.accountNumber).toBe(
      '1002-859-723089'
    )
    expect(stripRestrictedPiiForRole(merged, previous, 'PM').instructorInfo?.accountNumber).toBe(
      '1002-859-723089'
    )
  })

  it('파트너·뷰어는 이전 마스킹 값을 유지한다', () => {
    expect(
      stripRestrictedPiiForRole(merged, previous, 'PARTNER').instructorInfo?.accountNumber
    ).toBe('***********')
    expect(stripRestrictedPiiForRole(merged, previous, 'VIEWER').instructorInfo?.accountNumber).toBe(
      '***********'
    )
  })
})
