import { describe, expect, it } from 'vitest'
import { AccountDirectoryItemResponseAccountType } from '@/shared/api/generated/members/schemas/accountDirectoryItemResponseAccountType'
import { getAllMemberListRoleTypeLabel } from '@/features/user/shared/lib/member-list-display'
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
    expect(user.instructorMemberProfile).toBe('instructor_only')
  })

  it('roles SCHOOL_TEACHER는 INSTRUCTOR + school_teacher 프로필로 매핑한다', () => {
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

    expect(user.role).toBe('INSTRUCTOR')
    expect(user.instructorMemberProfile).toBe('school_teacher')
    expect(user.roles).toEqual(['SCHOOL_TEACHER'])
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
    expect(user.roles).toEqual(['SCHOOL_TEACHER', 'INSTRUCTOR'])
  })

  it('SCHOOL_TEACHER+INSTRUCTOR_REVOKED는 교사 겸직 박탈로 매핑한다', () => {
    const user = mapAccountDirectoryItemToUser({
      accountType: AccountDirectoryItemResponseAccountType.MEMBER,
      accountId: 12,
      memberId: 12,
      uuid: 'revoked-dual-12',
      email: 'r***@ja.org',
      name: '박탈겸직',
      roles: ['SCHOOL_TEACHER', 'INSTRUCTOR_REVOKED'],
      status: 'ACTIVE',
      createdAt: '2026-03-01T00:00:00Z',
    })

    expect(user.role).toBe('INSTRUCTOR')
    expect(user.instructorMemberProfile).toBe('instructor_dual')
    expect(user.roles).toEqual(['SCHOOL_TEACHER', 'INSTRUCTOR_REVOKED'])
    expect(
      getAllMemberListRoleTypeLabel({
        role: user.role,
        roles: user.roles,
        instructorMemberProfile: user.instructorMemberProfile,
      })
    ).toBe('학교(교사), 강사(권한박탈)')
  })

  it('createdByAdmin·본인인증 플래그를 registeredByAdmin·identitySelfSignup에 반영한다', () => {
    const user = mapAccountDirectoryItemToUser({
      accountType: AccountDirectoryItemResponseAccountType.MEMBER,
      accountId: 99,
      memberId: 99,
      uuid: 'admin-created-99',
      email: 'a***@ja.org',
      name: '관리자등록',
      roles: ['INDIVIDUAL'],
      status: 'ACTIVE',
      createdAt: '2026-04-01T00:00:00Z',
      createdByAdmin: true,
      identityVerified: false,
    })

    expect(user.registeredByAdmin).toBe(true)
    expect(user.identitySelfSignupCompletedAfterAdminRegistration).toBe(false)
  })

  it('createdByAdmin이 false이면 직접 가입으로 매핑한다', () => {
    const user = mapAccountDirectoryItemToUser({
      accountType: AccountDirectoryItemResponseAccountType.MEMBER,
      accountId: 100,
      memberId: 100,
      uuid: 'self-100',
      email: 's***@ja.org',
      name: '직접가입',
      roles: ['INDIVIDUAL'],
      status: 'ACTIVE',
      createdAt: '2026-04-02T00:00:00Z',
      createdByAdmin: false,
    })

    expect(user.registeredByAdmin).toBe(false)
  })
})
