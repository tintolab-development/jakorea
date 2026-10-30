import { beforeEach, describe, expect, it, vi } from 'vitest'

const { customInstanceMock } = vi.hoisted(() => ({
  customInstanceMock: vi.fn(),
}))

vi.mock('@/shared/api/orval-mutator', () => ({
  default: customInstanceMock,
  customInstance: customInstanceMock,
}))

import customInstance from '@/shared/api/orval-mutator'
import { fetchOrganizationStudentRosterPrivacyDetail } from './student-roster-api-client'

describe('fetchOrganizationStudentRosterPrivacyDetail', () => {
  beforeEach(() => {
    vi.mocked(customInstance).mockReset()
  })

  it('posts privacy-detail without a client audit reason', async () => {
    vi.mocked(customInstance).mockResolvedValue({
      revisionNo: 2,
      totalCount: 0,
      rows: [],
    })

    await fetchOrganizationStudentRosterPrivacyDetail(1691524)

    expect(customInstance).toHaveBeenCalledWith({
      url: '/api/admin/organization-applications/1691524/student-roster/privacy-detail',
      method: 'POST',
      headers: { 'Cache-Control': 'no-store' },
    })
  })
})
