import { beforeEach, describe, expect, it, vi } from 'vitest'

const fetchAdminMeProfile = vi.fn()
let userId: string | undefined = '7'

vi.mock('@/features/auth/api/admin-me-service', () => ({
  fetchAdminMeProfile: () => fetchAdminMeProfile(),
}))
vi.mock('@/features/auth/model/auth-store', () => ({
  useAuthStore: { getState: () => ({ user: userId ? { id: userId } : null }) },
}))

import { queryClient } from '@/shared/lib/query-client'
import { resolveApplicantRevealPii } from './applicant-reveal-pii'

describe('resolveApplicantRevealPii — 신청 상세 revealPii', () => {
  beforeEach(() => {
    queryClient.clear()
    fetchAdminMeProfile.mockReset()
    userId = '7'
  })

  it('Program Viewer(HOMEPAGE_PII_VIEW 없음)는 마스킹 상세를 요청한다', async () => {
    fetchAdminMeProfile.mockResolvedValue({ roleCode: 'PROGRAM_VIEWER', permissions: ['HOMEPAGE_VIEW'] })
    await expect(resolveApplicantRevealPii()).resolves.toBe(false)
  })

  it('HOMEPAGE_PII_VIEW 보유자와 Master는 원문을 요청한다', async () => {
    fetchAdminMeProfile.mockResolvedValue({
      roleCode: 'PROGRAM_MANAGER',
      permissions: ['HOMEPAGE_VIEW', 'HOMEPAGE_PII_VIEW'],
    })
    await expect(resolveApplicantRevealPii()).resolves.toBe(true)
    queryClient.clear()
    fetchAdminMeProfile.mockResolvedValue({ roleCode: 'MASTER', permissions: [] })
    await expect(resolveApplicantRevealPii()).resolves.toBe(true)
  })

  it('로그인 정보가 없거나 프로필 조회가 실패하면 마스킹으로 본다', async () => {
    userId = undefined
    await expect(resolveApplicantRevealPii()).resolves.toBe(false)
    userId = '7'
    fetchAdminMeProfile.mockRejectedValue(new Error('network'))
    await expect(resolveApplicantRevealPii()).resolves.toBe(false)
  })
})
