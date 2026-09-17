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
import { buildTemporaryParticipatingVolunteerSettlementRows } from '@/features/program/general/lib/participating-volunteer-temp-settlement'
import { isGeneralProgramTempMockEnabled } from '@/features/program/general/api/temp-mock-capabilities'
import type { ParticipatingVolunteerRow } from '@/features/program/general/model/participating-volunteers'
import type { InstructorSettlementUiStatus } from '@/shared/constants/instructor-settlement-status'
import type { SettlementListItemResponse } from '@/shared/api/generated/settlement/schemas'
import { useNotifyProgramApiUnavailableOnce } from '@/features/program/shared/lib/program-api-unavailable'

/**
 * 참여 봉사자 상세 — 정산 현황.
 * 강사 정산과 동일 API (`programId` + `instructorMemberId`=봉사자 memberId).
 * remote OFF / memberId 없음 → 빈 목록 + unavailable · mock 금지.
 * TODO(temp-mock): 열여라 참깨 — `VITE_GENERAL_PROGRAM_TEMP_MOCK_ENABLED` 시에만 임시 rows.
 */
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

  // TODO(temp-mock): 열여라 참깨 — 참여 봉사자 정산 현황 검증 후 삭제
  const temporaryRows = useMemo(
    () =>
      input.enabled === false || !isGeneralProgramTempMockEnabled()
        ? []
        : buildTemporaryParticipatingVolunteerSettlementRows(input.volunteer),
    [input.enabled, input.volunteer]
  )

  useNotifyProgramApiUnavailableOnce(
    Boolean(
      input.enabled !== false &&
        temporaryRows.length === 0 &&
        (!remoteEnabled || !volunteerMemberId)
    ),
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
    return settlementsQuery.data ?? []
  }, [queryEnabled, settlementsQuery.data])

  const rows = useMemo(() => {
    const remoteRows = queryEnabled
      ? mapSettlementsToParticipatingVolunteerSettlementRows(settlementItems, input.volunteer)
      : []
    if (temporaryRows.length === 0) return remoteRows
    return [...temporaryRows, ...remoteRows]
  }, [queryEnabled, settlementItems, input.volunteer, temporaryRows])

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
    remoteEnabled: remoteEnabled || temporaryRows.length > 0,
    isLoading: queryEnabled && settlementsQuery.isPending && temporaryRows.length === 0,
    rows,
    settlementItems,
    progressSummary,
    paymentStatementSummaryStatus,
    invalidate,
  }
}
