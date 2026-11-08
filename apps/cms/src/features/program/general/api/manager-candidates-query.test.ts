import { beforeEach, describe, expect, it, vi } from 'vitest'

const fetchAdminsPageRemote = vi.fn()

vi.mock('@/features/user/api/members-api-client', () => ({
  fetchAdminsPageRemote: (...args: unknown[]) => fetchAdminsPageRemote(...args),
}))

import {
  fetchAssignableManagerCandidates,
  MANAGER_CANDIDATES_PAGE_SIZE,
} from './manager-candidates-query'

describe('fetchAssignableManagerCandidates', () => {
  beforeEach(() => {
    fetchAdminsPageRemote.mockReset()
    fetchAdminsPageRemote.mockResolvedValue({
      items: [
        {
          adminAccountId: 7,
          name: ' 홍길동 ',
          email: 'a@test.com',
          phone: '010-****-5678',
          roleCode: 'MASTER',
        },
        { adminAccountId: null, name: 'no-id' },
        { adminAccountId: 8, name: '  ' },
      ],
      totalPages: 3,
    })
  })

  it('requests one ACTIVE page with trimmed keyword (no all-pages prefetch)', async () => {
    const rows = await fetchAssignableManagerCandidates('  홍 ')
    expect(fetchAdminsPageRemote).toHaveBeenCalledTimes(1)
    expect(fetchAdminsPageRemote).toHaveBeenCalledWith({
      page: 0,
      size: MANAGER_CANDIDATES_PAGE_SIZE,
      status: 'ACTIVE',
      keyword: '홍',
    })
    expect(rows).toEqual([
      {
        id: '7',
        name: '홍길동',
        email: 'a@test.com',
        phone: '010-****-5678',
        adminId: 7,
        cmsRoleCode: 'MASTER',
      },
    ])
  })

  it('omits keyword when blank', async () => {
    await fetchAssignableManagerCandidates('   ')
    expect(fetchAdminsPageRemote).toHaveBeenCalledWith({
      page: 0,
      size: MANAGER_CANDIDATES_PAGE_SIZE,
      status: 'ACTIVE',
    })
  })
})
