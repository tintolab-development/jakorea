import { useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchIndividualSettlementReviewListRemote,
  individualSettlementReviewQueryOptions,
  isIndividualSettlementReviewRemoteEnabled,
} from '@/features/program/general/api/individual-settlement-review-remote'
import {
  mapIndividualSettlementReviewRows,
  summarizeIndividualSettlementReviewRows,
  type IndividualSettlementReviewRow,
} from '@/features/program/general/lib/map-individual-settlement-review-rows'
import type { ParticipatingIndividualParticipantRow } from '@/features/program/general/model/participating-individual-participants'
import { useNotifyProgramApiUnavailableOnce } from '@/features/program/shared/lib/program-api-unavailable'

/** 개인 참여자 상세 — 강사 지급조서 원장이 아닌 개인 일정별 정산 심사 API. */
export function useParticipatingParticipantSettlementList(input: {
  programId: string
  participant: Pick<ParticipatingIndividualParticipantRow, 'id' | 'sessions'>
  enabled?: boolean
}): {
  remoteEnabled: boolean
  isLoading: boolean
  isError: boolean
  rows: IndividualSettlementReviewRow[]
  reviews: Awaited<ReturnType<typeof fetchIndividualSettlementReviewListRemote>>
  progressSummary: ReturnType<typeof summarizeIndividualSettlementReviewRows>
  invalidate: () => Promise<void>
} {
  const remoteEnabled = isIndividualSettlementReviewRemoteEnabled()
  const participantId = input.participant.id?.trim() ?? ''
  const queryEnabled = Boolean(
    input.enabled !== false && remoteEnabled && input.programId && participantId
  )

  useNotifyProgramApiUnavailableOnce(
    Boolean(input.enabled !== false && (!remoteEnabled || !participantId)),
    'general-participating-participant-settlement',
    '참여자 · 개인 정산 심사'
  )

  const reviewQuery = useQuery({
    ...individualSettlementReviewQueryOptions({
      programId: input.programId,
      participantId,
    }),
    enabled: queryEnabled,
    retry: false,
  })

  const reviews = useMemo(
    () => (queryEnabled ? reviewQuery.data ?? [] : []),
    [queryEnabled, reviewQuery.data]
  )
  const rows = useMemo(
    () =>
      queryEnabled && !reviewQuery.isPending && !reviewQuery.isError
        ? mapIndividualSettlementReviewRows({ sessions: input.participant.sessions, reviews })
        : [],
    [input.participant.sessions, queryEnabled, reviewQuery.isError, reviewQuery.isPending, reviews]
  )
  const progressSummary = useMemo(() => summarizeIndividualSettlementReviewRows(rows), [rows])

  const queryClient = useQueryClient()
  const invalidate = async () => {
    if (!participantId) return
    await queryClient.invalidateQueries({
      queryKey: individualSettlementReviewQueryOptions({
        programId: input.programId,
        participantId,
      }).queryKey,
    })
  }

  return {
    remoteEnabled,
    isLoading: queryEnabled && reviewQuery.isPending,
    isError: queryEnabled && reviewQuery.isError,
    rows,
    reviews,
    progressSummary,
    invalidate,
  }
}
