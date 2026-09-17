import { useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  isParticipatingInstructorSettlementsRemoteEnabled,
  participatingInstructorSettlementsQueryOptions,
} from '@/features/program/general/api/participating-instructor-settlements-remote'
import {
  mapSettlementsToParticipatingInstructorSettlementRows,
  summarizeParticipatingInstructorSettlementProgress,
  type ParticipatingInstructorSettlementApiRow,
} from '@/features/program/general/lib/map-settlement-to-participating-instructor-settlement-row'
import { buildTemporaryParticipatingInstructorSettlementRows } from '@/features/program/general/lib/participating-instructor-temp-settlement'
import { isGeneralProgramTempMockProgramId } from '@/features/program/general/api/temp-mock-capabilities'
import type { ParticipatingInstructorRow } from '@/features/program/general/model/participating-instructors'
import type { SettlementListItemResponse } from '@/shared/api/generated/settlement/schemas'
import { useNotifyProgramApiUnavailableOnce } from '@/features/program/shared/lib/program-api-unavailable'

export function useParticipatingInstructorSettlementList(input: {
  programId: string
  instructor: ParticipatingInstructorRow
  enabled?: boolean
}): {
  remoteEnabled: boolean
  isLoading: boolean
  rows: ParticipatingInstructorSettlementApiRow[]
  settlementItems: SettlementListItemResponse[]
  progressSummary: { completed: number; total: number }
  invalidate: () => Promise<void>
} {
  const remoteEnabled = isParticipatingInstructorSettlementsRemoteEnabled()
  const instructorMemberId = input.instructor.memberId?.trim() ?? ''
  const queryEnabled = Boolean(
    input.enabled !== false && remoteEnabled && input.programId && instructorMemberId
  )

  // TODO(temp-mock): 열여라 참깨 — 참여 강사 정산 현황 검증 후 삭제
  const temporaryRows = useMemo(
    () =>
      input.enabled === false || !isGeneralProgramTempMockProgramId(input.programId)
        ? []
        : buildTemporaryParticipatingInstructorSettlementRows(input.instructor),
    [input.enabled, input.programId, input.instructor]
  )

  useNotifyProgramApiUnavailableOnce(
    Boolean(
      input.enabled !== false &&
        temporaryRows.length === 0 &&
        (!remoteEnabled || !instructorMemberId)
    ),
    'general-participating-instructor-settlement',
    '참여 강사 · 정산 현황'
  )

  const settlementsQuery = useQuery({
    ...participatingInstructorSettlementsQueryOptions({
      programId: input.programId,
      instructorMemberId,
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
      ? mapSettlementsToParticipatingInstructorSettlementRows(settlementItems)
      : []
    if (temporaryRows.length === 0) return remoteRows
    return [...temporaryRows, ...remoteRows]
  }, [queryEnabled, settlementItems, temporaryRows])

  const progressSummary = useMemo(
    () => summarizeParticipatingInstructorSettlementProgress(rows),
    [rows]
  )

  const queryClient = useQueryClient()
  const invalidate = async () => {
    if (!instructorMemberId) return
    await queryClient.invalidateQueries({
      queryKey: participatingInstructorSettlementsQueryOptions({
        programId: input.programId,
        instructorMemberId,
      }).queryKey,
    })
  }

  return {
    remoteEnabled: remoteEnabled || temporaryRows.length > 0,
    isLoading: queryEnabled && settlementsQuery.isPending && temporaryRows.length === 0,
    rows,
    settlementItems,
    progressSummary,
    invalidate,
  }
}
