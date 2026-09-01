import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AccountDirectoryItemResponseAccountType } from '@/shared/api/generated/members/schemas/accountDirectoryItemResponseAccountType'
import type { AccountDirectoryItemResponse } from '@/shared/api/generated/members/schemas/accountDirectoryItemResponse'
import { fetchAllAccountsDirectoryPage } from './fetch-all-accounts-directory-page'

const fetchAllCmsMembersAndAdminsPageRemote = vi.hoisted(() => vi.fn())

vi.mock('./members-api-client', () => ({
  fetchAllCmsMembersAndAdminsPageRemote,
}))

function memberItem(
  id: number,
  roles: string[],
  name: string
): AccountDirectoryItemResponse {
  return {
    accountType: AccountDirectoryItemResponseAccountType.MEMBER,
    accountId: id,
    memberId: id,
    uuid: `member-uuid-${id}`,
    email: `${id}@ja.org`,
    name,
    roles,
    status: 'ACTIVE',
    createdAt: '2026-03-01T00:00:00Z',
  }
}

describe('fetchAllAccountsDirectoryPage', () => {
  beforeEach(() => {
    fetchAllCmsMembersAndAdminsPageRemote.mockReset()
  })

  it('유형 필터 없이 /members/all 한 페이지를 그대로 반환한다', async () => {
    fetchAllCmsMembersAndAdminsPageRemote.mockResolvedValueOnce({
      items: [memberItem(1, ['INDIVIDUAL'], '개인'), memberItem(2, ['INSTRUCTOR'], '강사')],
      totalElements: 2,
      totalPages: 1,
    })

    const result = await fetchAllAccountsDirectoryPage({ allTabRoleFilter: 'ALL' }, 0, 15)

    expect(fetchAllCmsMembersAndAdminsPageRemote).toHaveBeenCalledWith({
      keyword: undefined,
      createdAtFrom: undefined,
      createdAtTo: undefined,
      accountType: undefined,
      page: 0,
      size: 15,
    })
    expect(result.users.map(u => u.name)).toEqual(['개인', '강사'])
    expect(result.total).toBe(2)
    expect(result.hasMore).toBe(false)
  })

  it('개인 필터는 디렉터리 혼합 목록에서 INDIVIDUAL만 남긴다', async () => {
    fetchAllCmsMembersAndAdminsPageRemote.mockResolvedValueOnce({
      items: [
        memberItem(1, ['INDIVIDUAL'], '개인1'),
        memberItem(2, ['INSTRUCTOR'], '강사'),
        memberItem(3, ['SCHOOL_TEACHER'], '교사'),
        memberItem(4, ['INDIVIDUAL'], '개인2'),
      ],
      totalElements: 4,
      totalPages: 1,
    })

    const result = await fetchAllAccountsDirectoryPage(
      { accountType: 'MEMBER', allTabRoleFilter: 'INDIVIDUAL' },
      0,
      15
    )

    expect(result.users.map(u => u.name)).toEqual(['개인1', '개인2'])
    expect(result.total).toBe(2)
    expect(result.hasMore).toBe(false)
    expect(fetchAllCmsMembersAndAdminsPageRemote).toHaveBeenCalledWith(
      expect.objectContaining({ accountType: 'MEMBER', size: 15 })
    )
  })

  it('학교(교사) 필터는 SCHOOL_TEACHER만 남긴다', async () => {
    fetchAllCmsMembersAndAdminsPageRemote.mockResolvedValueOnce({
      items: [
        memberItem(1, ['INDIVIDUAL'], '개인'),
        memberItem(2, ['SCHOOL_TEACHER'], '교사'),
        memberItem(3, ['SCHOOL_TEACHER', 'INSTRUCTOR'], '겸직'),
      ],
      totalElements: 3,
      totalPages: 1,
    })

    const result = await fetchAllAccountsDirectoryPage(
      { accountType: 'MEMBER', allTabRoleFilter: 'SCHOOL_TEACHER' },
      0,
      15
    )

    expect(result.users.map(u => u.name)).toEqual(['교사'])
    expect(result.total).toBe(1)
  })
})
