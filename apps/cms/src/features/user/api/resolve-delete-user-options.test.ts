import { describe, expect, it } from 'vitest'
import { registerMemberIdMapping } from '@/features/user/api/member-id-registry'
import { resolveDeleteUserOptions } from '@/features/user/api/resolve-delete-user-options'

describe('resolveDeleteUserOptions', () => {
  it('User.memberId를 delete 옵션에 전달한다', () => {
    expect(
      resolveDeleteUserOptions({
        id: 'uuid-1',
        memberId: 42,
        role: 'INDIVIDUAL',
        email: 'a@test.com',
        name: '회원',
        isActive: true,
        createdAt: '',
        updatedAt: '',
      }).memberId
    ).toBe(42)
  })

  it('memberId가 없으면 member-{id}에서 파싱한다', () => {
    expect(
      resolveDeleteUserOptions({
        id: 'member-99',
        role: 'INSTRUCTOR',
        email: 'i@test.com',
        name: '강사',
        isActive: true,
        createdAt: '',
        updatedAt: '',
      }).memberId
    ).toBe(99)
  })

  it('uuid id는 registry 매핑으로 memberId를 보강한다', () => {
    registerMemberIdMapping('uuid-abc', 77)
    expect(
      resolveDeleteUserOptions({
        id: 'uuid-abc',
        role: 'INDIVIDUAL',
        email: 'u@test.com',
        name: '회원',
        isActive: true,
        createdAt: '',
        updatedAt: '',
      }).memberId
    ).toBe(77)
  })

  it('관리자 adminAccountId를 보존한다', () => {
    expect(
      resolveDeleteUserOptions({
        id: '59dd7c10-69b7-418c-aac1-bdc5d5cb5e0b',
        adminAccountId: 7,
        role: 'ADMIN',
        email: 'admin@test.com',
        name: '관리자',
        isActive: true,
        createdAt: '',
        updatedAt: '',
      })
    ).toEqual({
      role: 'ADMIN',
      adminAccountId: 7,
      memberId: undefined,
      email: 'admin@test.com',
    })
  })
})
