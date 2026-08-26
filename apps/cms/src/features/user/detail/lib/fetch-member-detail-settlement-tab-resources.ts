import type { QueryClient } from '@tanstack/react-query'
import {
  fetchInstructorSettlementStatementJoinQuery,
  fetchInstructorSettlementsQuery,
} from '@/features/user/api/instructor-member-settlements-remote'
import { isMemberInstructorSettlementsRemoteEnabled } from '@/features/user/api/member-remote-capabilities'

/** 강사·교사 겸 강사 — 정산 현황(payment-status) 탭 전용 API */
export async function fetchMemberDetailSettlementTabResources(
  queryClient: QueryClient,
  params: {
    settlementTabActive: boolean
    membersRemote: boolean
    showInstructorPayment: boolean
    instructorMemberId?: number | null
  }
): Promise<void> {
  const { settlementTabActive, membersRemote, showInstructorPayment, instructorMemberId } = params
  if (
    !settlementTabActive ||
    !membersRemote ||
    !showInstructorPayment ||
    instructorMemberId == null
  ) {
    return
  }
  if (!isMemberInstructorSettlementsRemoteEnabled()) return

  await Promise.all([
    fetchInstructorSettlementsQuery(queryClient, instructorMemberId),
    fetchInstructorSettlementStatementJoinQuery(queryClient, instructorMemberId),
  ])
}
