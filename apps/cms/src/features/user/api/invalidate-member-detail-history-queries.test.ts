import { describe, expect, it, vi } from 'vitest'
import { invalidateMemberDetailHistoryQueries } from './invalidate-member-detail-history-queries'
import { memberQueryKeys } from './member-query-keys'

describe('invalidateMemberDetailHistoryQueries', () => {
  it('invalidates applications/programHistory and removes enrollmentSummary for member', async () => {
    const invalidateQueries = vi.fn().mockResolvedValue(undefined)
    const removeQueries = vi.fn()
    const queryClient = { invalidateQueries, removeQueries } as never

    await invalidateMemberDetailHistoryQueries(queryClient, { memberId: 171001 })

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: memberQueryKeys.applications(171001),
    })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: memberQueryKeys.programHistory(171001),
    })
    expect(removeQueries).toHaveBeenCalledWith({
      queryKey: [...memberQueryKeys.all, 'enrollmentSummary', 171001],
    })
  })

  it('invalidates school enrollment history by organizationId', async () => {
    const invalidateQueries = vi.fn().mockResolvedValue(undefined)
    const removeQueries = vi.fn()
    const queryClient = { invalidateQueries, removeQueries } as never

    await invalidateMemberDetailHistoryQueries(queryClient, { organizationId: 501 })

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: [...memberQueryKeys.all, 'schoolProgramEnrollmentHistory', 501],
    })
    expect(removeQueries).not.toHaveBeenCalled()
  })
})
