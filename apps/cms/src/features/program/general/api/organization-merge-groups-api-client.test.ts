import { beforeEach, describe, expect, it, vi } from 'vitest'

const { customInstanceMock } = vi.hoisted(() => ({
  customInstanceMock: vi.fn(),
}))

vi.mock('@/shared/api/orval-mutator', () => ({
  default: customInstanceMock,
  customInstance: customInstanceMock,
}))

import customInstance from '@/shared/api/orval-mutator'
import { patchOrganizationMergeGroupRemote } from './organization-merge-groups-api-client'

describe('patchOrganizationMergeGroupRemote', () => {
  beforeEach(() => {
    vi.mocked(customInstance).mockReset()
  })

  it('합반 담당 교사 PATCH body만 보낸다', async () => {
    vi.mocked(customInstance).mockResolvedValue({
      id: 10,
      leadTeacherMemberId: 190022,
    })

    await patchOrganizationMergeGroupRemote('168001', 10, { leadTeacherMemberId: 190022 })

    expect(customInstance).toHaveBeenCalledWith({
      url: '/api/admin/programs/168001/organization-merge-groups/10',
      method: 'PATCH',
      data: { leadTeacherMemberId: 190022 },
    })
  })
})
