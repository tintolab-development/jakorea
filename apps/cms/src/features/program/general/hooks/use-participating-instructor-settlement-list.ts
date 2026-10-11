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

  useNotifyProgramApiUnavailableOnce(
    Boolean(input.enabled !== false && (!remoteEnabled || !instructorMemberId)),
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
    if (!queryEnabled) return []
    return mapSettlementsToParticipatingInstructorSettlementRows(settlementItems)
  }, [queryEnabled, settlementItems])

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
    remoteEnabled,
    isLoading: queryEnabled && settlementsQuery.isPending,
    rows,
    settlementItems,
    progressSummary,
    invalidate,
  }
}
