import { describe, expect, it } from 'vitest'
import { AccountDirectoryItemResponseAccountType } from '@/shared/api/generated/members/schemas/accountDirectoryItemResponseAccountType'
import { mapAccountDirectoryItemToUser } from './map-account-directory-item-to-user'

describe('mapAccountDirectoryItemToUser', () => {
  it('ADMIN_ACCOUNT 행을 ADMIN User로 매핑한다', () => {
    const user = mapAccountDirectoryItemToUser({
      accountType: AccountDirectoryItemResponseAccountType.ADMIN_ACCOUNT,
      accountId: 7,
      adminAccountId: 7,
      uuid: 'admin-uuid-7',
      email: 'a***@ja.kr',
      name: '관리자',
      roles: ['MASTER'],
      status: 'ACTIVE',
      createdAt: '2026-01-01T00:00:00Z',
    })

    expect(user.role).toBe('ADMIN')
    expect(user.adminAccountId).toBe(7)
    expect(user.memberId).toBeUndefined()
    expect(user.id).toBe('admin-uuid-7')
    expect(user.listMetrics?.adminPermissionVariant).toBe('manager')
  })

  it('MEMBER 행을 memberId·역할로 매핑한다', () => {
    const user = mapAccountDirectoryItemToUser({
      accountType: AccountDirectoryItemResponseAccountType.MEMBER,
      accountId: 42,
      memberId: 42,
      uuid: 'member-uuid-42',
      email: 'm***@ja.org',
      name: '홍길동',
      roles: ['INSTRUCTOR'],
      status: 'ACTIVE',
      createdAt: '2026-02-01T00:00:00Z',
    })

    expect(user.role).toBe('INSTRUCTOR')
    expect(user.memberId).toBe(42)
    expect(user.adminAccountId).toBeUndefined()
    expect(user.id).toBe('member-uuid-42')
  })

  it('roles SCHOOL_TEACHER는 학교(교사) 프로필로 매핑한다', () => {
    const user = mapAccountDirectoryItemToUser({
      accountType: AccountDirectoryItemResponseAccountType.MEMBER,
      accountId: 10,
      memberId: 10,
      uuid: 'teacher-uuid-10',
      email: 't***@ja.org',
      name: '김교사',
      roles: ['SCHOOL_TEACHER'],
      status: 'ACTIVE',
      createdAt: '2026-03-01T00:00:00Z',
    })

    expect(user.role).toBe('INDIVIDUAL')
    expect(user.instructorMemberProfile).toBe('school_teacher')
  })

  it('SCHOOL_TEACHER+INSTRUCTOR는 교사 겸직으로 매핑한다', () => {
    const user = mapAccountDirectoryItemToUser({
      accountType: AccountDirectoryItemResponseAccountType.MEMBER,
      accountId: 11,
      memberId: 11,
      uuid: 'dual-uuid-11',
      email: 'd***@ja.org',
      name: '이겸직',
      roles: ['SCHOOL_TEACHER', 'INSTRUCTOR'],
      status: 'ACTIVE',
      createdAt: '2026-03-01T00:00:00Z',
    })

    expect(user.role).toBe('INSTRUCTOR')
    expect(user.instructorMemberProfile).toBe('instructor_dual')
  })
})
