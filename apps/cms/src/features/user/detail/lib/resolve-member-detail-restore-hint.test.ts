import { describe, expect, it } from 'vitest'
import { QueryClient, type InfiniteData } from '@tanstack/react-query'
import type { GetUsersPageResult } from '@/entities/user/api/user-service'
import { registerMemberIdMapping } from '@/features/user/api/member-id-registry'
import { memberQueryKeys } from '@/features/user/api/member-query-keys'
import {
  canResolveMemberIdForDetailRestore,
  findUserInMemberListQueries,
  isSameMemberDetailIdentity,
  memberDetailOpenIdentityFromUser,
  parseMemberIdFromUserId,
  resolveMemberDetailRestoreHint,
} from './resolve-member-detail-restore-hint'

describe('parseMemberIdFromUserId', () => {
  it('member- prefix id를 파싱한다', () => {
    expect(parseMemberIdFromUserId('member-42')).toBe(42)
  })
})

describe('resolveMemberDetailRestoreHint', () => {
  it('kind=instructors에서 role 힌트를 INSTRUCTOR로 추론한다', () => {
    const hint = resolveMemberDetailRestoreHint({
      userId: 'uuid-1',
      urlCtx: {},
      listKind: 'instructors',
      storeUsersById: {},
      listUsers: [],
    })
    expect(hint.role).toBe('INSTRUCTOR')
  })

  it('목록 행에서 memberId를 찾는다', () => {
    const hint = resolveMemberDetailRestoreHint({
      userId: 'uuid-1',
      urlCtx: {},
      listKind: 'instructors',
      storeUsersById: {},
      listUsers: [
        {
          id: 'uuid-1',
          memberId: 77,
          email: 't@example.com',
          name: '강사',
          role: 'INSTRUCTOR',
          isActive: true,
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      ],
    })
    expect(hint.memberId).toBe(77)
    expect(hint.role).toBe('INSTRUCTOR')
  })

  it('URL memberId를 우선한다', () => {
    registerMemberIdMapping('uuid-1', 10)
    const hint = resolveMemberDetailRestoreHint({
      userId: 'uuid-1',
      urlCtx: { memberId: 99, role: 'INSTRUCTOR' },
      listKind: 'all',
      storeUsersById: {},
      listUsers: [],
    })
    expect(hint.memberId).toBe(99)
  })
})

describe('findUserInMemberListQueries', () => {
  it('React Query list 캐시에서 uuid를 찾는다', () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData<InfiniteData<GetUsersPageResult>>(
      memberQueryKeys.list('instructors'),
      {
        pages: [
          {
            users: [
              {
                id: 'uuid-cache',
                memberId: 5,
                email: 'a@b.c',
                name: 'A',
                role: 'INSTRUCTOR',
                isActive: true,
                createdAt: '2026-01-01',
                updatedAt: '2026-01-01',
              },
            ],
            total: 1,
            hasMore: false,
          },
        ],
        pageParams: [0],
      }
    )

    expect(findUserInMemberListQueries(queryClient, 'uuid-cache')?.memberId).toBe(5)
  })
})

describe('resolveMemberDetailRestoreHint — school organization', () => {
  it('organization- id와 목록 행에서 organizationId를 복원한다', () => {
    const hint = resolveMemberDetailRestoreHint({
      userId: 'organization-12',
      urlCtx: {},
      listKind: 'institutions',
      storeUsersById: {},
      listUsers: [
        {
          id: 'organization-12',
          organizationId: 12,
          email: '-',
          name: '테스트고',
          role: 'SCHOOL',
          isActive: true,
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      ],
    })
    expect(hint.organizationId).toBe(12)
    expect(hint.role).toBe('SCHOOL')
    expect(canResolveMemberIdForDetailRestore('organization-12', hint)).toBe(true)
  })
})

describe('isSameMemberDetailIdentity', () => {
  it('목록 uuid와 canonical admin-account id를 같은 상세로 본다', () => {
    const open = memberDetailOpenIdentityFromUser({
      id: 'uuid-admin',
      adminAccountId: 171601,
      role: 'ADMIN',
    })
    expect(
      isSameMemberDetailIdentity(open, 'admin-account-171601', { adminAccountId: 171601 })
    ).toBe(true)
  })

  it('organization canonical id를 같은 학교 상세로 본다', () => {
    const open = memberDetailOpenIdentityFromUser({
      id: 'uuid-school',
      organizationId: 12,
      role: 'SCHOOL',
    })
    expect(
      isSameMemberDetailIdentity(open, 'organization-12', {
        organizationId: 12,
        role: 'SCHOOL',
      })
    ).toBe(true)
  })

  it('같은 organizationId여도 교사와 학교는 다른 상세로 본다', () => {
    const schoolOpen = memberDetailOpenIdentityFromUser({
      id: 'organization-9001',
      organizationId: 9001,
      role: 'SCHOOL',
    })
    expect(
      isSameMemberDetailIdentity(schoolOpen, 'teacher-uuid', {
        organizationId: 9001,
        memberId: 501,
        role: 'INSTRUCTOR',
      })
    ).toBe(false)

    const teacherOpen = memberDetailOpenIdentityFromUser({
      id: 'teacher-uuid',
      organizationId: 9001,
      memberId: 501,
      role: 'INSTRUCTOR',
    })
    expect(
      isSameMemberDetailIdentity(teacherOpen, 'organization-9001', {
        organizationId: 9001,
        role: 'SCHOOL',
      })
    ).toBe(false)
  })
})

describe('resolveMemberDetailRestoreHint — teacher with organizationId', () => {
  it('교사가 organizationId를 가져도 listKind=instructors면 INSTRUCTOR로 둔다', () => {
    const hint = resolveMemberDetailRestoreHint({
      userId: 'teacher-uuid',
      urlCtx: {},
      listKind: 'instructors',
      storeUsersById: {},
      listUsers: [
        {
          id: 'teacher-uuid',
          memberId: 501,
          organizationId: 9001,
          email: 't@example.com',
          name: '김성재',
          role: 'INSTRUCTOR',
          isActive: true,
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      ],
    })
    expect(hint.role).toBe('INSTRUCTOR')
    expect(hint.organizationId).toBe(9001)
  })

  it('user 없이 organizationId만 있고 일반 listKind면 SCHOOL로 강제하지 않는다', () => {
    const hint = resolveMemberDetailRestoreHint({
      userId: 'some-uuid',
      urlCtx: {},
      listKind: 'all',
      storeUsersById: {},
      listUsers: [],
    })
    // organizationId 없음 → listKind all의 기본 role (개별/전체 매핑)
    expect(hint.role).not.toBe('SCHOOL')
  })
})

describe('canResolveMemberIdForDetailRestore', () => {
  it('memberId 또는 member- prefix가 있으면 true', () => {
    expect(canResolveMemberIdForDetailRestore('member-3', {})).toBe(true)
    expect(canResolveMemberIdForDetailRestore('uuid', { memberId: 1 })).toBe(true)
    expect(canResolveMemberIdForDetailRestore('uuid', {})).toBe(false)
  })

  it('admin-account-{id} 또는 adminAccountId 힌트면 memberId 없이도 true', () => {
    expect(canResolveMemberIdForDetailRestore('admin-account-168404', {})).toBe(true)
    expect(canResolveMemberIdForDetailRestore('uuid', { adminAccountId: 168404 })).toBe(true)
  })
})
