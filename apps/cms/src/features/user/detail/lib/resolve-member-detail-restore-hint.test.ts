import { describe, expect, it } from 'vitest'
import { QueryClient, type InfiniteData } from '@tanstack/react-query'
import type { GetUsersPageResult } from '@/entities/user/api/user-service'
import { registerMemberIdMapping } from '@/features/user/api/member-id-registry'
import { memberQueryKeys } from '@/features/user/api/member-query-keys'
import {
  canResolveMemberIdForDetailRestore,
  findUserInMemberListQueries,
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

describe('canResolveMemberIdForDetailRestore', () => {
  it('memberId 또는 member- prefix가 있으면 true', () => {
    expect(canResolveMemberIdForDetailRestore('member-3', {})).toBe(true)
    expect(canResolveMemberIdForDetailRestore('uuid', { memberId: 1 })).toBe(true)
    expect(canResolveMemberIdForDetailRestore('uuid', {})).toBe(false)
  })
})
