import { describe, expect, it } from 'vitest'
import type { User } from '@/types/user'
import { getProgramScheduleKindsForAdminUser } from './program-schedule-categories'

function adminUser(
  overrides: Partial<Omit<User, 'password'>>
): Omit<User, 'password'> {
  return {
    id: 'admin-1',
    email: 'admin@example.com',
    name: '관리자',
    role: 'ADMIN',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('getProgramScheduleKindsForAdminUser', () => {
  it('MASTER는 일반·1사1교·UJAT·Gemini 일정 위젯을 모두 노출한다', () => {
    expect(
      getProgramScheduleKindsForAdminUser(adminUser({ adminLevel: 'MASTER' }))
    ).toEqual(['general', 'company_school', 'ujat', 'gemini'])
  })

  it('일반 관리자도 mock 카탈로그 없이 4유형 위젯 슬롯을 노출한다', () => {
    expect(
      getProgramScheduleKindsForAdminUser(
        adminUser({
          adminLevel: 'GENERAL',
          programRoles: {},
        })
      )
    ).toEqual(['general', 'company_school', 'ujat', 'gemini'])
  })

  it('ADMIN이 아니면 빈 목록이다', () => {
    expect(
      getProgramScheduleKindsForAdminUser(
        adminUser({
          id: 'u1',
          email: 'a@b.c',
          name: '회원',
          role: 'INSTRUCTOR',
        })
      )
    ).toEqual([])
  })
})
