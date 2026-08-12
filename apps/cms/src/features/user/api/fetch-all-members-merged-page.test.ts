import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
  compareUsersByCreatedAtDesc,
  createInitialMergeCursor,
  fetchAllMembersMergedPage,
  matchesCreatedAtRange,
} from './fetch-all-members-merged-page'
import { buildListQueryApiFilters } from '@/pages/users/user-list-table.config'

vi.mock('@/features/user/api/members-api-client', () => ({
  fetchMembersPageRemote: vi.fn(),
  fetchAdminsPageRemote: vi.fn(),
}))

import {
  fetchAdminsPageRemote,
  fetchMembersPageRemote,
} from '@/features/user/api/members-api-client'

const mockFetchMembers = vi.mocked(fetchMembersPageRemote)
const mockFetchAdmins = vi.mocked(fetchAdminsPageRemote)

function memberItem(id: string, createdAt: string) {
  return {
    uuid: id,
    memberId: Number(id.replace(/\D/g, '') || 1),
    email: `${id}@test.com`,
    name: `Member ${id}`,
    roles: ['general'],
    createdAt,
  }
}

function adminItem(id: number, createdAt: string) {
  return {
    adminAccountId: id,
    uuid: `admin-${id}`,
    email: `admin${id}@test.com`,
    name: `Admin ${id}`,
    roleCode: 'VIEWER',
    createdAt,
  }
}

describe('compareUsersByCreatedAtDesc', () => {
  it('sorts by createdAt descending', () => {
    const newer = { id: 'a', createdAt: '2026-08-12T00:00:00Z' } as Omit<
      import('@/types/user').User,
      'password'
    >
    const older = { id: 'b', createdAt: '2026-08-01T00:00:00Z' } as Omit<
      import('@/types/user').User,
      'password'
    >
    expect(compareUsersByCreatedAtDesc(newer, older)).toBeLessThan(0)
    expect(compareUsersByCreatedAtDesc(older, newer)).toBeGreaterThan(0)
  })

  it('tie-breaks by id', () => {
    const a = { id: 'aaa', createdAt: '2026-08-01T00:00:00Z' } as Omit<
      import('@/types/user').User,
      'password'
    >
    const b = { id: 'bbb', createdAt: '2026-08-01T00:00:00Z' } as Omit<
      import('@/types/user').User,
      'password'
    >
    expect(compareUsersByCreatedAtDesc(a, b)).toBeLessThan(0)
  })
})

describe('matchesCreatedAtRange', () => {
  it('filters by inclusive date range', () => {
    const user = { id: '1', createdAt: '2026-08-10T12:00:00Z' } as Omit<
      import('@/types/user').User,
      'password'
    >
    expect(matchesCreatedAtRange(user, '2026-08-01', '2026-08-31')).toBe(true)
    expect(matchesCreatedAtRange(user, '2026-08-11', '2026-08-31')).toBe(false)
    expect(matchesCreatedAtRange(user, '2026-08-01', '2026-08-09')).toBe(false)
  })
})

describe('buildListQueryApiFilters mergeAdminAccounts', () => {
  it('sets mergeAdminAccounts for kind=all without role filter', () => {
    expect(buildListQueryApiFilters({ kind: 'all' }).mergeAdminAccounts).toBe(true)
  })

  it('does not merge for kind=admins', () => {
    expect(buildListQueryApiFilters({ kind: 'admins' }).mergeAdminAccounts).toBeUndefined()
    expect(buildListQueryApiFilters({ kind: 'admins' }).role).toBe('ADMIN')
  })

  it('does not merge when all tab has role subtype filter', () => {
    expect(
      buildListQueryApiFilters({ kind: 'all', role: 'INDIVIDUAL' }).mergeAdminAccounts
    ).toBeUndefined()
  })
})

describe('fetchAllMembersMergedPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('merges members and admins by createdAt desc', async () => {
    mockFetchMembers.mockResolvedValueOnce({
      items: [memberItem('m1', '2026-08-05T00:00:00Z'), memberItem('m2', '2026-08-01T00:00:00Z')],
      page: 0,
      size: 15,
      totalElements: 2,
      totalPages: 1,
    })
    mockFetchAdmins.mockResolvedValueOnce({
      items: [adminItem(1, '2026-08-10T00:00:00Z'), adminItem(2, '2026-08-03T00:00:00Z')],
      page: 0,
      size: 15,
      totalElements: 2,
      totalPages: 1,
    })

    const result = await fetchAllMembersMergedPage({}, createInitialMergeCursor(), 15)

    expect(result.users.map(u => u.id)).toEqual([
      'admin-1',
      'm1',
      'admin-2',
      'm2',
    ])
    expect(result.total).toBe(4)
    expect(result.hasMore).toBe(false)
  })

  it('emits 15 per page and carries remainder in cursor', async () => {
    const memberItems = Array.from({ length: 10 }, (_, i) =>
      memberItem(`m${i}`, `2026-08-${String(i + 1).padStart(2, '0')}T00:00:00Z`)
    )
    const adminItems = Array.from({ length: 10 }, (_, i) =>
      adminItem(i + 1, `2026-08-${String(i + 11).padStart(2, '0')}T00:00:00Z`)
    )

    mockFetchMembers.mockResolvedValueOnce({
      items: memberItems,
      totalElements: 10,
      totalPages: 1,
    })
    mockFetchAdmins.mockResolvedValueOnce({
      items: adminItems,
      totalElements: 10,
      totalPages: 1,
    })

    const page1 = await fetchAllMembersMergedPage({}, createInitialMergeCursor(), 15)
    expect(page1.users).toHaveLength(15)
    expect(page1.hasMore).toBe(true)
    const buffered =
      page1.nextPageParam.members.buffer.length + page1.nextPageParam.admins.buffer.length
    expect(buffered).toBe(5)

    const page2 = await fetchAllMembersMergedPage({}, page1.nextPageParam, 15)
    expect(page2.users).toHaveLength(5)
    expect(page2.hasMore).toBe(false)
  })

  it('continues fetching when one source is exhausted', async () => {
    mockFetchMembers.mockResolvedValueOnce({
      items: [memberItem('m1', '2026-08-20T00:00:00Z')],
      totalElements: 1,
      totalPages: 1,
    })
    mockFetchAdmins
      .mockResolvedValueOnce({
        items: [adminItem(1, '2026-08-15T00:00:00Z')],
        totalElements: 2,
        totalPages: 2,
      })
      .mockResolvedValueOnce({
        items: [adminItem(2, '2026-08-10T00:00:00Z')],
        totalElements: 2,
        totalPages: 2,
      })

    const result = await fetchAllMembersMergedPage({}, createInitialMergeCursor(), 2)

    expect(result.users.map(u => u.name)).toEqual(['Member m1', 'Admin 1'])
    expect(mockFetchAdmins).toHaveBeenCalledTimes(1)

    const page2 = await fetchAllMembersMergedPage({}, result.nextPageParam, 2)
    expect(page2.users.map(u => u.name)).toEqual(['Admin 2'])
    expect(mockFetchAdmins).toHaveBeenCalledTimes(2)
    expect(mockFetchMembers).toHaveBeenCalledTimes(1)
  })

  it('client-filters admins by createdAt range', async () => {
    mockFetchMembers.mockResolvedValueOnce({
      items: [memberItem('m1', '2026-08-10T00:00:00Z')],
      totalElements: 1,
      totalPages: 1,
    })
    mockFetchAdmins.mockResolvedValueOnce({
      items: [
        adminItem(1, '2026-08-10T00:00:00Z'),
        adminItem(2, '2026-07-01T00:00:00Z'),
      ],
      totalElements: 2,
      totalPages: 1,
    })

    const result = await fetchAllMembersMergedPage(
      { createdAtFrom: '2026-08-01', createdAtTo: '2026-08-31' },
      createInitialMergeCursor(),
      15
    )

    expect(result.users.some(u => u.id === 'admin-2')).toBe(false)
    expect(result.users.some(u => u.id === 'admin-1')).toBe(true)
  })
})
