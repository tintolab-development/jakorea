import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/features/settlement-management/api/settlement-api-client', () => ({
  fetchSettlementListPageRemote: vi.fn(),
}))

import { fetchSettlementListPageRemote } from '@/features/settlement-management/api/settlement-api-client'
import { fetchParticipatingInstructorSettlementsRemote } from './participating-instructor-settlements-remote'

describe('fetchParticipatingInstructorSettlementsRemote', () => {
  beforeEach(() => {
    vi.mocked(fetchSettlementListPageRemote).mockReset()
  })

  it('programId·instructorMemberId를 함께 보내고 instructorSessionSummary를 유지한다', async () => {
    vi.mocked(fetchSettlementListPageRemote).mockResolvedValue({
      items: [],
      page: 0,
      size: 20,
      totalElements: 0,
      totalPages: 0,
      instructorSessionSummary: { completed: 4, total: 4 },
    })

    const result = await fetchParticipatingInstructorSettlementsRemote({
      programId: '186550',
      instructorMemberId: '190115',
    })

    expect(fetchSettlementListPageRemote).toHaveBeenCalledWith({
      programId: 186550,
      instructorMemberId: 190115,
      includePaid: true,
      page: 0,
      size: 20,
    })
    expect(result).toEqual({ items: [], instructorSessionSummary: { completed: 4, total: 4 } })
  })

  it('summary 누락은 null로 둔다 (0/0으로 바꾸지 않음)', async () => {
    vi.mocked(fetchSettlementListPageRemote).mockResolvedValue({ items: [], totalPages: 0 })
    const result = await fetchParticipatingInstructorSettlementsRemote({
      programId: 1,
      instructorMemberId: 2,
    })
    expect(result.instructorSessionSummary).toBeNull()
  })

  it('조회 실패를 빈 목록으로 바꾸지 않는다', async () => {
    vi.mocked(fetchSettlementListPageRemote).mockRejectedValue(new Error('500'))
    await expect(
      fetchParticipatingInstructorSettlementsRemote({ programId: 1, instructorMemberId: 2 })
    ).rejects.toThrow('500')
  })
})
