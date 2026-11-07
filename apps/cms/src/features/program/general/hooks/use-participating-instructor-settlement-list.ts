import { useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  isParticipatingInstructorSettlementsRemoteEnabled,
  participatingInstructorSettlementsQueryOptions,
} from '@/features/program/general/api/participating-instructor-settlements-remote'
import {
  mapSettlementsToParticipatingInstructorSettlementRows,
  type ParticipatingInstructorSettlementApiRow,
} from '@/features/program/general/lib/map-settlement-to-participating-instructor-settlement-row'
import type { ParticipatingInstructorRow } from '@/features/program/general/model/participating-instructors'
import type { SettlementListItemResponse } from '@/shared/api/generated/settlement/schemas'
import { useNotifyProgramApiUnavailableOnce } from '@/features/program/shared/lib/program-api-unavailable'

export function useParticipatingInstructorSettlementList(input: {
  programId: string
  instructor: ParticipatingInstructorRow
  enabled?: boolean
  /** 참여자 상세처럼 배정 일정이 행 SSOT일 때는 강사 API 미연동 안내를 띄우지 않는다. */
  notifyUnavailable?: boolean
}): {
  remoteEnabled: boolean
  isLoading: boolean
  rows: ParticipatingInstructorSettlementApiRow[]
  settlementItems: SettlementListItemResponse[]
  /** 서버 instructorSessionSummary. 누락·조회 실패면 null (0/0 fallback 금지) */
  progressSummary: { completed: number; total: number } | null
  isError: boolean
  invalidate: () => Promise<void>
} {
  const remoteEnabled = isParticipatingInstructorSettlementsRemoteEnabled()
  const instructorMemberId = input.instructor.memberId?.trim() ?? ''
  const queryEnabled = Boolean(
    input.enabled !== false && remoteEnabled && input.programId && instructorMemberId
  )

  useNotifyProgramApiUnavailableOnce(
    Boolean(
      input.notifyUnavailable !== false &&
        input.enabled !== false &&
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
    return settlementsQuery.data?.items ?? []
  }, [queryEnabled, settlementsQuery.data])

  const rows = useMemo(() => {
    if (!queryEnabled) return []
    return mapSettlementsToParticipatingInstructorSettlementRows(settlementItems)
  }, [queryEnabled, settlementItems])

  const progressSummary = useMemo(() => {
    if (!queryEnabled) return null
    const summary = settlementsQuery.data?.instructorSessionSummary
    if (summary?.completed == null || summary.total == null) return null
    return { completed: summary.completed, total: summary.total }
  }, [queryEnabled, settlementsQuery.data])

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
    isError: queryEnabled && settlementsQuery.isError,
    invalidate,
  }
}
