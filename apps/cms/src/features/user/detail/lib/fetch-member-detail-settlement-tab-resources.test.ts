import { describe, expect, it, vi } from 'vitest'
import type { QueryClient } from '@tanstack/react-query'
import { fetchMemberDetailSettlementTabResources } from './fetch-member-detail-settlement-tab-resources'

vi.mock('@/features/user/api/instructor-member-settlements-remote', () => ({
  fetchInstructorSettlementsQuery: vi.fn().mockResolvedValue([]),
  fetchInstructorSettlementStatementJoinQuery: vi.fn().mockResolvedValue(new Map()),
}))

vi.mock('@/features/user/api/member-remote-capabilities', () => ({
  isMemberInstructorSettlementsRemoteEnabled: vi.fn().mockReturnValue(true),
}))

import {
  fetchInstructorSettlementsQuery,
  fetchInstructorSettlementStatementJoinQuery,
} from '@/features/user/api/instructor-member-settlements-remote'

describe('fetchMemberDetailSettlementTabResources', () => {
  it('payment-status 탭 — settlements·statements join fetch', async () => {
    const queryClient = {} as QueryClient

    await fetchMemberDetailSettlementTabResources(queryClient, {
      settlementTabActive: true,
      membersRemote: true,
      showInstructorPayment: true,
      instructorMemberId: 42,
    })

    expect(fetchInstructorSettlementsQuery).toHaveBeenCalledWith(queryClient, 42)
    expect(fetchInstructorSettlementStatementJoinQuery).toHaveBeenCalledWith(queryClient, 42)
  })

  it('교사(school_teacher) 등 정산 LNB 없으면 fetch하지 않음', async () => {
    vi.mocked(fetchInstructorSettlementsQuery).mockClear()
    vi.mocked(fetchInstructorSettlementStatementJoinQuery).mockClear()
    const queryClient = {} as QueryClient

    await fetchMemberDetailSettlementTabResources(queryClient, {
      settlementTabActive: true,
      membersRemote: true,
      showInstructorPayment: false,
      instructorMemberId: 42,
    })

    expect(fetchInstructorSettlementsQuery).not.toHaveBeenCalled()
    expect(fetchInstructorSettlementStatementJoinQuery).not.toHaveBeenCalled()
  })

  it('탭 밖이면 fetch하지 않음', async () => {
    vi.mocked(fetchInstructorSettlementsQuery).mockClear()
    vi.mocked(fetchInstructorSettlementStatementJoinQuery).mockClear()
    const queryClient = {} as QueryClient

    await fetchMemberDetailSettlementTabResources(queryClient, {
      settlementTabActive: false,
      membersRemote: true,
      showInstructorPayment: true,
      instructorMemberId: 42,
    })

    expect(fetchInstructorSettlementsQuery).not.toHaveBeenCalled()
    expect(fetchInstructorSettlementStatementJoinQuery).not.toHaveBeenCalled()
  })
})
