import { describe, expect, it } from 'vitest'
import { mapMemberListItemToUser } from './map-member-list-item'

describe('mapMemberListItemToUser — ADMIN', () => {
  it('adminAccountId 필드를 admin 상세 path id로 보존', () => {
    const user = mapMemberListItemToUser({
      uuid: 'a1c1b91b-d1ce-4bec-a192-8b3290113227',
      adminAccountId: 7,
      email: 'adm***@test.com',
      name: '관리자',
      roles: ['ADMIN'],
    })

    expect(user.role).toBe('ADMIN')
    expect(user.adminAccountId).toBe(7)
  })

  it('role 필드 없이 adminAccountId만 있어도 ADMIN으로 분기', () => {
    const user = mapMemberListItemToUser({
      uuid: 'admin-uuid',
      adminAccountId: 9,
      email: 'a@test.com',
      name: '관리자',
      roles: [],
    })

    expect(user.role).toBe('ADMIN')
    expect(user.adminAccountId).toBe(9)
  })

  it('adminLevel만 있어도 ADMIN으로 분기', () => {
    const user = mapMemberListItemToUser({
      uuid: 'admin-uuid',
      adminLevel: 'MASTER',
      email: 'a@test.com',
      name: '관리자',
    })

    expect(user.role).toBe('ADMIN')
  })

  it('legacy role 필드만 있고 roles가 없으면 INDIVIDUAL로 본다', () => {
    const user = mapMemberListItemToUser({
      uuid: 'legacy-role-only',
      role: 'SCHOOL',
      email: 's@test.com',
      name: '학교',
    })

    expect(user.role).toBe('INDIVIDUAL')
  })

  it('roles에 SCHOOL이 있을 때만 SCHOOL 회원으로 본다', () => {
    const user = mapMemberListItemToUser({
      uuid: 'school-member',
      roles: ['SCHOOL'],
      email: 's@test.com',
      name: 'OO초등학교',
      organizationName: 'OO초등학교',
    })

    expect(user.role).toBe('SCHOOL')
  })

  it('memberId 숫자 id와 adminAccountId를 혼동하지 않음', () => {
    const user = mapMemberListItemToUser({
      memberId: 42,
      uuid: 'member-uuid',
      id: '42',
      roles: ['ADMIN'],
      email: 'a@test.com',
      name: '관리자',
    })

    expect(user.memberId).toBe(42)
    expect(user.adminAccountId).toBeUndefined()
  })

  it('memberId 필드가 없어도 id가 member-{n}이면 memberId를 채운다', () => {
    const user = mapMemberListItemToUser({
      uuid: 'a1c1b91b-d1ce-4bec-a192-8b3290113227',
      id: 'member-55',
      roles: ['INSTRUCTOR'],
      email: 'i@test.com',
      name: '강사',
    })

    expect(user.memberId).toBe(55)
    expect(user.id).toBe('a1c1b91b-d1ce-4bec-a192-8b3290113227')
  })

  it('memberId·id 모두 없고 id가 숫자 문자열이면 memberId로 사용', () => {
    const user = mapMemberListItemToUser({
      uuid: 'uuid-only',
      id: '88',
      roles: ['INDIVIDUAL'],
      email: 'u@test.com',
      name: '회원',
    })

    expect(user.memberId).toBe(88)
  })

  it('UserResponse.id slug(local-admin-*)는 admin path id로 쓰지 않음', () => {
    const user = mapMemberListItemToUser({
      id: 'local-admin-member-viewer',
      adminAccountId: 7,
      email: 'a@test.com',
      name: '관리자',
      roles: ['ADMIN'],
    })

    expect(user.id).toBe('admin-account-7')
    expect(user.adminAccountId).toBe(7)
  })

  it('adminAccountId 문자열 숫자도 매핑', () => {
    const user = mapMemberListItemToUser({
      id: 'local-admin-member-viewer',
      adminAccountId: '9' as unknown as number,
      roles: ['ADMIN'],
      email: 'a@test.com',
      name: '관리자',
    })

    expect(user.adminAccountId).toBe(9)
    expect(user.id).toBe('admin-account-9')
  })
})
