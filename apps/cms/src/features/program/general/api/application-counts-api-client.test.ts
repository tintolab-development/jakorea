import { beforeEach, describe, expect, it, vi } from 'vitest'

const customInstance = vi.fn()

vi.mock('@/shared/api/orval-mutator', () => ({
  default: (...args: unknown[]) => customInstance(...args),
}))

import { fetchProgramApplicationCountsRemote } from './application-counts-api-client'

describe('fetchProgramApplicationCountsRemote', () => {
  beforeEach(() => {
    customInstance.mockReset()
  })

  it('uses the official programId query and unwraps the response body', async () => {
    customInstance.mockResolvedValue({
      success: true,
      data: [{ programId: 186100, recruitmentId: 31, totalCount: 2 }],
    })

    await expect(fetchProgramApplicationCountsRemote('186100')).resolves.toEqual([
      { programId: 186100, recruitmentId: 31, totalCount: 2 },
    ])
    expect(customInstance).toHaveBeenCalledWith({
      url: '/api/admin/applications/counts',
      method: 'GET',
      params: { programId: 186100 },
    })
  })

  it('keeps recruitmentId null instead of coercing it to 0', async () => {
    customInstance.mockResolvedValue({
      success: true,
      data: [{ programId: 186100, recruitmentId: null, targetType: 'ORGANIZATION', totalCount: 1 }],
    })

    await expect(fetchProgramApplicationCountsRemote('186100')).resolves.toEqual([
      { programId: 186100, recruitmentId: null, targetType: 'ORGANIZATION', totalCount: 1 },
    ])
  })

  it('rejects a non-persisted program id before making a request', async () => {
    await expect(fetchProgramApplicationCountsRemote('general-program-local-1')).rejects.toThrow(
      '신청 현황을 조회할 프로그램 ID가 유효하지 않습니다.'
    )
    expect(customInstance).not.toHaveBeenCalled()
  })
})
