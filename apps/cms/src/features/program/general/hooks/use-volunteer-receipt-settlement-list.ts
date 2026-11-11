import { useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { isIndividualSettlementReviewRemoteEnabled } from '@/features/program/general/api/individual-settlement-review-remote'
import { generalProgramProgressQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import {
  hasVolunteerReceiptSettlementTarget,
  volunteerReceiptSettlementListQueryOptions,
  volunteerReceiptSettlementReviewKey,
  type VolunteerReceiptSettlementTarget,
} from '@/features/program/general/api/volunteer-settlement-review-remote'
import {
  assignedSessionsForIndividualSettlementReview,
  resolveIndividualSettlementReviewRowsForQueryState,
  summarizeIndividualSettlementReviewRows,
  type IndividualSettlementReviewListRow,
} from '@/features/program/general/lib/map-individual-settlement-review-rows'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import { useNotifyProgramApiUnavailableOnce } from '@/features/program/shared/lib/program-api-unavailable'
import { readApiErrorAlertMessage } from '@/shared/lib/extract-api-error-message'

/** 봉사자 상세 — 정산 현황 (개인 일정별 정산 심사 API, applicationType=VOLUNTEER). */
export function useVolunteerReceiptSettlementList(input: {
  programId: string
  target: VolunteerReceiptSettlementTarget
  /** 배정 일정. 없으면 정산 신청 건만 행으로 그린다 */
  assignedSessions?: ReadonlyArray<ParticipatingSchoolSession>
  enabled?: boolean
  /** 원격 미설정 안내 키 — 화면마다 1회 */
  unavailableNoticeKey: string
}): {
  remoteEnabled: boolean
  isLoading: boolean
  isError: boolean
  errorMessage: string | null
  rows: IndividualSettlementReviewListRow[]
  summary: { submitted: number; approved: number; rejected: number; none: number; total: number }
  reviewKey: string
  invalidate: () => Promise<void>
} {
  const remoteEnabled = isIndividualSettlementReviewRemoteEnabled()
  const hasTarget = hasVolunteerReceiptSettlementTarget(input.target)
  const reviewKey = volunteerReceiptSettlementReviewKey(input.target)
  const queryEnabled = Boolean(
    input.enabled !== false && remoteEnabled && input.programId && hasTarget
  )

  useNotifyProgramApiUnavailableOnce(
    Boolean(input.enabled !== false && (!remoteEnabled || !hasTarget)),
    input.unavailableNoticeKey,
    '봉사자 · 정산 현황'
  )

  const reviewsQuery = useQuery({
    ...volunteerReceiptSettlementListQueryOptions({
      programId: input.programId,
      target: input.target,
    }),
    enabled: queryEnabled,
    retry: false,
  })

  const assignedSessions = useMemo(
    () => assignedSessionsForIndividualSettlementReview(input.assignedSessions ?? []),
    [input.assignedSessions]
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
    if (!hasTarget) return
    await queryClient.invalidateQueries({
      queryKey: generalProgramProgressQueryKeys.individualSettlementReviews(
        input.programId,
        reviewKey
      ),
    })
  }

  return {
    remoteEnabled,
    isLoading: queryEnabled && reviewsQuery.isPending,
    isError,
    errorMessage: isError
      ? readApiErrorAlertMessage(reviewsQuery.error, '봉사자 정산 현황을 불러오지 못했습니다.')
      : null,
    rows,
    summary,
    reviewKey,
    invalidate,
  }
}
