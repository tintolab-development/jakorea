import { useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  isParticipatingInstructorSettlementsRemoteEnabled,
  participatingInstructorSettlementsQueryOptions,
} from '@/features/program/general/api/participating-instructor-settlements-remote'
import {
  mapSettlementsToParticipatingInstructorSettlementRows,
  summarizeParticipatingInstructorPaymentStatementStatus,
  summarizeParticipatingInstructorSettlementProgress,
  type ParticipatingInstructorSettlementApiRow,
} from '@/features/program/general/lib/map-settlement-to-participating-instructor-settlement-row'
import type { ParticipatingIndividualParticipantRow } from '@/features/program/general/model/participating-individual-participants'
import type { InstructorSettlementUiStatus } from '@/shared/constants/instructor-settlement-status'
import type { SettlementListItemResponse } from '@/shared/api/generated/settlement/schemas'
import { useNotifyProgramApiUnavailableOnce } from '@/features/program/shared/lib/program-api-unavailable'

/** 참여자 상세 — 정산 현황 (강사·봉사자와 동일 settlement API). */
export function useParticipatingParticipantSettlementList(input: {
  programId: string
  participant: Pick<ParticipatingIndividualParticipantRow, 'memberId'>
  enabled?: boolean
}): {
  remoteEnabled: boolean
  isLoading: boolean
  rows: ParticipatingInstructorSettlementApiRow[]
  settlementItems: SettlementListItemResponse[]
  progressSummary: { completed: number; total: number }
  paymentStatementSummaryStatus: InstructorSettlementUiStatus
  invalidate: () => Promise<void>
} {
  const remoteEnabled = isParticipatingInstructorSettlementsRemoteEnabled()
  const participantMemberId = input.participant.memberId?.trim() ?? ''
  const queryEnabled = Boolean(
    input.enabled !== false && remoteEnabled && input.programId && participantMemberId
  )

  useNotifyProgramApiUnavailableOnce(
    Boolean(input.enabled !== false && (!remoteEnabled || !participantMemberId)),
    'general-participating-participant-settlement',
    '참여자 · 정산 현황'
  )

  const settlementsQuery = useQuery({
    ...participatingInstructorSettlementsQueryOptions({
      programId: input.programId,
      instructorMemberId: participantMemberId,
    }),
    enabled: queryEnabled,
    retry: false,
  })

  const settlementItems = useMemo(() => {
    if (!queryEnabled) return []
    return settlementsQuery.data ?? []
  }, [queryEnabled, settlementsQuery.data])

  const rows = useMemo(() => {
    if (!queryEnabled) return []
    return mapSettlementsToParticipatingInstructorSettlementRows(settlementItems)
  }, [queryEnabled, settlementItems])

  const progressSummary = useMemo(
    () => summarizeParticipatingInstructorSettlementProgress(rows),
    [rows]
  )

  const paymentStatementSummaryStatus = useMemo(
    () => summarizeParticipatingInstructorPaymentStatementStatus(rows),
    [rows]
  )

  const queryClient = useQueryClient()
  const invalidate = async () => {
    if (!participantMemberId) return
    await queryClient.invalidateQueries({
      queryKey: participatingInstructorSettlementsQueryOptions({
        programId: input.programId,
        instructorMemberId: participantMemberId,
      }).queryKey,
    })
  }

  return {
    remoteEnabled,
    isLoading: queryEnabled && settlementsQuery.isPending,
    rows,
    settlementItems,
    progressSummary,
    paymentStatementSummaryStatus,
    invalidate,
  }
}
