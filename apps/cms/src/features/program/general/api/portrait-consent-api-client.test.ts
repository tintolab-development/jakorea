import { beforeEach, describe, expect, it, vi } from 'vitest'

const { customInstanceMock } = vi.hoisted(() => ({
  customInstanceMock: vi.fn(),
}))

vi.mock('@/shared/api/orval-mutator', () => ({
  default: customInstanceMock,
  customInstance: customInstanceMock,
}))

import customInstance from '@/shared/api/orval-mutator'
import { fetchOrganizationPortraitConsentRemote } from './portrait-consent-api-client'

describe('fetchOrganizationPortraitConsentRemote', () => {
  beforeEach(() => {
    vi.mocked(customInstance).mockReset()
  })

  it('기관 단위 초상권 동의서 GET을 호출한다', async () => {
    vi.mocked(customInstance).mockResolvedValue({
      success: true,
      data: {
        fileObjectId: 88001,
        originalFileName: '초상권동의서.pdf',
        status: 'SUBMITTED',
      },
    })

    await expect(fetchOrganizationPortraitConsentRemote('1691524')).resolves.toEqual({
      fileObjectId: 88001,
      originalFileName: '초상권동의서.pdf',
      status: 'SUBMITTED',
    })
    expect(customInstance).toHaveBeenCalledWith({
      url: '/api/admin/organization-applications/1691524/portrait-consent',
      method: 'GET',
    })
  })

  it('미제출·빈 본문은 null이다', async () => {
    vi.mocked(customInstance).mockResolvedValue({ success: true, data: {} })
    await expect(fetchOrganizationPortraitConsentRemote(1691524)).resolves.toBeNull()

    vi.mocked(customInstance).mockResolvedValue(null)
    await expect(fetchOrganizationPortraitConsentRemote(1691524)).resolves.toBeNull()
  })
})
