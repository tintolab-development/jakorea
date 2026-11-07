import { useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  isParticipatingInstructorSettlementsRemoteEnabled,
  participatingInstructorSettlementsQueryOptions,
} from '@/features/program/general/api/participating-instructor-settlements-remote'
import {
  mapSettlementsToParticipatingVolunteerSettlementRows,
  summarizeParticipatingVolunteerPaymentStatementStatus,
  summarizeParticipatingVolunteerSettlementProgress,
  type ParticipatingVolunteerSettlementApiRow,
} from '@/features/program/general/lib/map-settlement-to-participating-volunteer-settlement-row'
import type { ParticipatingVolunteerRow } from '@/features/program/general/model/participating-volunteers'
import type { InstructorSettlementUiStatus } from '@/shared/constants/instructor-settlement-status'
import type { SettlementListItemResponse } from '@/shared/api/generated/settlement/schemas'
import { useNotifyProgramApiUnavailableOnce } from '@/features/program/shared/lib/program-api-unavailable'

/** 참여 봉사자 상세 — 정산 현황 (강사와 동일 settlement API). */
export function useParticipatingVolunteerSettlementList(input: {
  programId: string
  volunteer: ParticipatingVolunteerRow
  enabled?: boolean
}): {
  remoteEnabled: boolean
  isLoading: boolean
  rows: ParticipatingVolunteerSettlementApiRow[]
  settlementItems: SettlementListItemResponse[]
  progressSummary: { completed: number; total: number }
  paymentStatementSummaryStatus: InstructorSettlementUiStatus
  invalidate: () => Promise<void>
} {
  const remoteEnabled = isParticipatingInstructorSettlementsRemoteEnabled()
  const volunteerMemberId =
    input.volunteer.memberId != null ? String(input.volunteer.memberId).trim() : ''
  const queryEnabled = Boolean(
    input.enabled !== false && remoteEnabled && input.programId && volunteerMemberId
  )

  useNotifyProgramApiUnavailableOnce(
    Boolean(input.enabled !== false && (!remoteEnabled || !volunteerMemberId)),
    'general-participating-volunteer-settlement',
    '참여 봉사자 · 정산 현황'
  )

  const settlementsQuery = useQuery({
    ...participatingInstructorSettlementsQueryOptions({
      programId: input.programId,
      instructorMemberId: volunteerMemberId,
    }),
    enabled: queryEnabled,
    retry: false,
  })

  const settlementItems = useMemo(() => {
    if (!queryEnabled) return []
    return settlementsQuery.data?.items ?? []
  }, [queryEnabled, settlementsQuery.data])

  const rows = useMemo(() => {
    if (!queryEnabled) return []
    return mapSettlementsToParticipatingVolunteerSettlementRows(settlementItems, input.volunteer)
  }, [queryEnabled, settlementItems, input.volunteer])

  const progressSummary = useMemo(
    () => summarizeParticipatingVolunteerSettlementProgress(rows),
    [rows]
  )

  const paymentStatementSummaryStatus = useMemo(
    () => summarizeParticipatingVolunteerPaymentStatementStatus(rows),
    [rows]
  )

  const queryClient = useQueryClient()
  const invalidate = async () => {
    if (!volunteerMemberId) return
    await queryClient.invalidateQueries({
      queryKey: participatingInstructorSettlementsQueryOptions({
        programId: input.programId,
        instructorMemberId: volunteerMemberId,
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
