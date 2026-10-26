import { useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  individualSettlementReviewListQueryOptions,
  isIndividualSettlementReviewRemoteEnabled,
} from '@/features/program/general/api/individual-settlement-review-remote'
import { generalProgramProgressQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import {
  assignedSessionsForIndividualSettlementReview,
  resolveIndividualSettlementReviewRowsForQueryState,
  summarizeIndividualSettlementReviewRows,
  type IndividualSettlementReviewListRow,
} from '@/features/program/general/lib/map-individual-settlement-review-rows'
import type { ParticipatingIndividualParticipantRow } from '@/features/program/general/model/participating-individual-participants'
import { useNotifyProgramApiUnavailableOnce } from '@/features/program/shared/lib/program-api-unavailable'
import { readApiErrorAlertMessage } from '@/shared/lib/extract-api-error-message'

/** 개인 참여자 상세 — 정산 현황 (개인 일정별 정산 심사 API). */
export function useParticipatingParticipantSettlementList(input: {
  programId: string
  participant: Pick<ParticipatingIndividualParticipantRow, 'id' | 'memberId' | 'sessions'>
  enabled?: boolean
}): {
  remoteEnabled: boolean
  isLoading: boolean
  isError: boolean
  errorMessage: string | null
  rows: IndividualSettlementReviewListRow[]
  summary: { submitted: number; approved: number; rejected: number; none: number; total: number }
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
    '참여자 · 정산 현황'
  )

  const reviewsQuery = useQuery({
    ...individualSettlementReviewListQueryOptions({
      programId: input.programId,
      participantId,
    }),
    enabled: queryEnabled,
    retry: false,
  })

  const assignedSessions = useMemo(
    () => assignedSessionsForIndividualSettlementReview(input.participant.sessions),
    [input.participant.sessions]
  )

  const listReady = queryEnabled && reviewsQuery.isSuccess
  const isError = queryEnabled && reviewsQuery.isError

  const rows = useMemo(
    () =>
      resolveIndividualSettlementReviewRowsForQueryState({
        listReady,
        isError,
        assignedSessions,
        applications: reviewsQuery.data ?? [],
      }),
    [assignedSessions, isError, listReady, reviewsQuery.data]
  )

  const summary = useMemo(() => summarizeIndividualSettlementReviewRows(rows), [rows])

  const queryClient = useQueryClient()
  const invalidate = async () => {
    if (!participantId) return
    await queryClient.invalidateQueries({
      queryKey: generalProgramProgressQueryKeys.individualSettlementReviews(
        input.programId,
        participantId
      ),
    })
  }

  return {
    remoteEnabled,
    isLoading: queryEnabled && reviewsQuery.isPending,
    isError,
    errorMessage: isError
      ? readApiErrorAlertMessage(reviewsQuery.error, '개인 정산 현황을 불러오지 못했습니다.')
      : null,
    rows,
    summary,
    invalidate,
  }
}
