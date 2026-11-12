import { describe, expect, it, vi } from 'vitest'
import {
  buildParticipatingInstructorFeeSaveFailedMessage,
  registerParticipatingInstructorWithFeePolicy,
} from './participating-instructor-register'

describe('registerParticipatingInstructorWithFeePolicy', () => {
  it('등록 응답 participantId로 강사비를 저장한다', async () => {
    const saveFeePolicy = vi.fn().mockResolvedValue({})
    const result = await registerParticipatingInstructorWithFeePolicy({
      createParticipant: async () => ({ participantId: 1695024 }),
      saveFeePolicy,
    })
    expect(saveFeePolicy).toHaveBeenCalledWith('1695024')
    expect(result).toEqual({ status: 'registered', participantId: '1695024' })
  })

  it('강사비 저장이 실패해도 등록은 완료로 보고 fee-failed를 돌려준다', async () => {
    const error = new Error('422')
    const result = await registerParticipatingInstructorWithFeePolicy({
      createParticipant: async () => ({ participantId: 7 }),
      saveFeePolicy: async () => {
        throw error
      },
    })
    expect(result).toEqual({ status: 'fee-failed', participantId: '7', error })
  })

  it('등록 자체가 실패하면 그대로 throw하고 강사비는 저장하지 않는다', async () => {
    const saveFeePolicy = vi.fn()
    await expect(
      registerParticipatingInstructorWithFeePolicy({
        createParticipant: async () => {
          throw new Error('409')
        },
        saveFeePolicy,
      })
    ).rejects.toThrow('409')
    expect(saveFeePolicy).not.toHaveBeenCalled()
  })

  it('등록 응답에 participantId가 없으면 강사비를 저장하지 않고 fee-failed', async () => {
    const saveFeePolicy = vi.fn()
    const result = await registerParticipatingInstructorWithFeePolicy({
      createParticipant: async () => ({ participantId: null }),
      saveFeePolicy,
    })
    expect(saveFeePolicy).not.toHaveBeenCalled()
    expect(result.status).toBe('fee-failed')
  })

  it('실패 안내에 등록 완료와 [정보 수정] 재저장 경로를 담는다', () => {
    const message = buildParticipatingInstructorFeeSaveFailedMessage('강사비 기준을 확인해 주세요.')
    expect(message).toContain('등록은 완료')
    expect(message).toContain('[정보 수정]')
  })
})
