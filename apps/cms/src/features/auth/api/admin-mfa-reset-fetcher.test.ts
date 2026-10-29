import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchAdminMfaReset, fetchAdminMfaResetStepUp } from './admin-mfa-reset-fetcher'

const { stepUp, reset } = vi.hoisted(() => ({
  stepUp: vi.fn(),
  reset: vi.fn(),
}))

vi.mock('@/shared/api/generated/members/members-api', () => ({
  getJAKoreaCMSBackendAPIMembersSubset: () => ({ stepUp, reset }),
}))

describe('admin-mfa-reset-fetcher', () => {
  beforeEach(() => {
    stepUp.mockReset()
    reset.mockReset()
  })

  it('step-up은 빈 본문과 proof만 반환한다', async () => {
    stepUp.mockResolvedValue({ stepUpProof: 'proof-1' })
    await expect(fetchAdminMfaResetStepUp(22)).resolves.toBe('proof-1')
    expect(stepUp).toHaveBeenCalledWith(22, {}, { skipGlobalErrorAlert: true })
  })

  it('reset은 생성된 클라이언트로 본문을 보낸다', async () => {
    reset.mockResolvedValue(undefined)
    await expect(
      fetchAdminMfaReset(22, {
        reason: '기기 분실',
        recoveryType: 'ADMINISTRATIVE_RECOVERY',
        verificationReference: 'T-1',
        stepUpProof: 'proof-1',
      })
    ).resolves.toBeUndefined()
    expect(reset).toHaveBeenCalledWith(
      22,
      {
        reason: '기기 분실',
        recoveryType: 'ADMINISTRATIVE_RECOVERY',
        verificationReference: 'T-1',
        stepUpProof: 'proof-1',
      },
      { skipGlobalErrorAlert: true }
    )
  })
})
