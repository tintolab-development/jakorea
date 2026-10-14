import { beforeEach, describe, expect, it, vi } from 'vitest'

const { customInstanceMock } = vi.hoisted(() => ({
  customInstanceMock: vi.fn(),
}))

vi.mock('@/shared/api/orval-mutator', () => ({
  default: customInstanceMock,
  customInstance: customInstanceMock,
}))

vi.mock('@/features/data-management/api/unwrap-api-body', () => ({
  unwrapApiBody: vi.fn((value: unknown) => value),
}))

import customInstance from '@/shared/api/orval-mutator'
import { fetchLatestFormResponseByContextRemote } from './form-responses-api-client'

describe('fetchLatestFormResponseByContextRemote', () => {
  beforeEach(() => {
    vi.mocked(customInstance).mockReset()
  })

  it('uses the newest form response instead of assuming the first list item is latest', async () => {
    vi.mocked(customInstance)
      .mockResolvedValueOnce({
        items: [
          { formResponseId: 1851546, submittedAt: '2026-10-14T08:00:00Z' },
          { formResponseId: 1851547, submittedAt: '2026-10-14T09:00:00Z' },
        ],
      })
      .mockResolvedValueOnce({ formResponseId: 1851547, answers: [] })

    await fetchLatestFormResponseByContextRemote({
      programId: 186101,
      contextType: 'ORGANIZATION_APPLICATION',
      contextId: 1691277,
    })

    expect(customInstance).toHaveBeenNthCalledWith(2, {
      url: '/api/admin/form-responses/1851547',
      method: 'GET',
    })
  })
})
