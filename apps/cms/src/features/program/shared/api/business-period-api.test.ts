import { beforeEach, describe, expect, it, vi } from 'vitest'

const customInstance = vi.fn()

vi.mock('@/shared/api/orval-mutator', () => ({
  default: (...args: unknown[]) => customInstance(...args),
}))

describe('extendBusinessPeriod', () => {
  beforeEach(() => {
    customInstance.mockReset()
  })

  it('businessEndDate만 필수이고 빈 사유는 보내지 않는다', async () => {
    customInstance.mockResolvedValue({
      success: true,
      data: { programId: 5001, businessEndDate: '2026-11-30' },
    })
    const { extendBusinessPeriod } = await import('./business-period-api')

    await extendBusinessPeriod('5001', { businessEndDate: '2026-11-30', reason: '   ' })

    expect(customInstance).toHaveBeenCalledWith({
      url: '/api/admin/programs/5001/business-period',
      method: 'PATCH',
      data: { businessEndDate: '2026-11-30' },
    })
  })

  it('사유가 있으면 reason을 함께 보낸다', async () => {
    customInstance.mockResolvedValue({
      success: true,
      data: { programId: 5001, businessEndDate: '2026-11-30' },
    })
    const { extendBusinessPeriod } = await import('./business-period-api')

    await extendBusinessPeriod('5001', {
      businessEndDate: '2026-11-30',
      reason: '강의 보고서 마감 연장',
    })

    expect(customInstance).toHaveBeenCalledWith({
      url: '/api/admin/programs/5001/business-period',
      method: 'PATCH',
      data: {
        businessEndDate: '2026-11-30',
        reason: '강의 보고서 마감 연장',
      },
    })
  })
})
