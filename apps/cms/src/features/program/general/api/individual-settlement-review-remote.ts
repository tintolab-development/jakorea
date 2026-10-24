import { queryOptions } from '@tanstack/react-query'
import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import { generalProgramProgressQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { shouldUseGeneralProgramProgressRemoteApi } from '@/features/program/general/api/program-progress-remote-capabilities'
import { getApiErrorHttpStatus } from '@/shared/lib/extract-api-error-message'
import { customInstance } from '@/shared/api/orval-mutator'
import type { ApiResponseIndividualSettlementReviewDecision } from '@/shared/api/generated/dashboard/schemas/apiResponseIndividualSettlementReviewDecision'
import type { ApiResponseIndividualSettlementReviewDetail } from '@/shared/api/generated/dashboard/schemas/apiResponseIndividualSettlementReviewDetail'
import type { IndividualSettlementReviewDecision } from '@/shared/api/generated/dashboard/schemas/individualSettlementReviewDecision'
import type { IndividualSettlementReviewDetail } from '@/shared/api/generated/dashboard/schemas/individualSettlementReviewDetail'
import type { IndividualSettlementReviewListItem } from '@/shared/api/generated/dashboard/schemas/individualSettlementReviewListItem'
import type { IndividualSettlementReviewRequest } from '@/shared/api/generated/dashboard/schemas/individualSettlementReviewRequest'
import type { PageResponseIndividualSettlementReviewListItem } from '@/shared/api/generated/dashboard/schemas/pageResponseIndividualSettlementReviewListItem'

export const INDIVIDUAL_SETTLEMENT_REVIEW_LIST_URL =
  '/api/admin/individual-settlement-applications'

export function individualSettlementReviewDetailUrl(settlementApplicationId: number): string {
  return `${INDIVIDUAL_SETTLEMENT_REVIEW_LIST_URL}/${settlementApplicationId}`
}

export function individualSettlementReviewApproveUrl(settlementApplicationId: number): string {
  return `${individualSettlementReviewDetailUrl(settlementApplicationId)}/approve`
}

export function individualSettlementReviewRejectUrl(settlementApplicationId: number): string {
  return `${individualSettlementReviewDetailUrl(settlementApplicationId)}/reject`
}

export function parseIndividualSettlementNumericId(
  value: string | number | undefined | null
): number | null {
  if (value == null || value === '') return null
  const n = typeof value === 'number' ? value : Number(String(value).trim())
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : null
}

export function buildIndividualSettlementReviewListParams(input: {
  programId: string | number
  participantId: string | number
  page?: number
  size?: number
  status?: string
}): { programId: number; participantId: number; page: number; size: number; status?: string } | null {
  const programId = parseIndividualSettlementNumericId(input.programId)
  const participantId = parseIndividualSettlementNumericId(input.participantId)
  if (programId == null || participantId == null) return null
  const params: {
    programId: number
    participantId: number
    page: number
    size: number
    status?: string
  } = {
    programId,
    participantId,
    page: input.page ?? 0,
    size: input.size ?? 100,
  }
  const status = input.status?.trim()
  if (status) params.status = status
  return params
}

export function unwrapIndividualSettlementReviewListPage(
  payload: unknown
): PageResponseIndividualSettlementReviewListItem {
  const body = unwrapApiBody<PageResponseIndividualSettlementReviewListItem>(payload)
  if (body == null || typeof body !== 'object') {
    return { items: [] }
  }
  return {
    items: Array.isArray(body.items) ? body.items : [],
    page: body.page,
    size: body.size,
    totalElements: body.totalElements,
    totalPages: body.totalPages,
  }
}

export function unwrapIndividualSettlementReviewDetail(
  payload: unknown
): IndividualSettlementReviewDetail {
  const wrapped = payload as ApiResponseIndividualSettlementReviewDetail | IndividualSettlementReviewDetail
  if (
    wrapped != null &&
    typeof wrapped === 'object' &&
    'success' in wrapped &&
    (wrapped as ApiResponseIndividualSettlementReviewDetail).success === true &&
    'data' in wrapped
  ) {
    return unwrapApiBody<IndividualSettlementReviewDetail>(wrapped)
  }
  return unwrapApiBody<IndividualSettlementReviewDetail>(payload)
}

export function unwrapIndividualSettlementReviewDecision(
  payload: unknown
): IndividualSettlementReviewDecision {
  const wrapped = payload as ApiResponseIndividualSettlementReviewDecision | IndividualSettlementReviewDecision
  if (
    wrapped != null &&
    typeof wrapped === 'object' &&
    'success' in wrapped &&
    (wrapped as ApiResponseIndividualSettlementReviewDecision).success === true &&
    'data' in wrapped
  ) {
    return unwrapApiBody<IndividualSettlementReviewDecision>(wrapped)
  }
  return unwrapApiBody<IndividualSettlementReviewDecision>(payload)
}

export function isIndividualSettlementReviewConflict(error: unknown): boolean {
  return getApiErrorHttpStatus(error) === 409
}

export async function fetchIndividualSettlementReviewListRemote(input: {
  programId: string | number
  participantId: string | number
  page?: number
  size?: number
  status?: string
}): Promise<IndividualSettlementReviewListItem[]> {
  const params = buildIndividualSettlementReviewListParams(input)
  if (params == null) return []

  const response = await customInstance<unknown>({
    url: INDIVIDUAL_SETTLEMENT_REVIEW_LIST_URL,
    method: 'GET',
    params,
  })
  return unwrapIndividualSettlementReviewListPage(response).items ?? []
}

export async function fetchIndividualSettlementReviewDetailRemote(
  settlementApplicationId: number
): Promise<IndividualSettlementReviewDetail> {
  const response = await customInstance<unknown>({
    url: individualSettlementReviewDetailUrl(settlementApplicationId),
    method: 'GET',
  })
  return unwrapIndividualSettlementReviewDetail(response)
}

export async function approveIndividualSettlementReviewRemote(input: {
  settlementApplicationId: number
  expectedRevisionNo: number
}): Promise<IndividualSettlementReviewDecision> {
  const body: IndividualSettlementReviewRequest = {
    expectedRevisionNo: input.expectedRevisionNo,
  }
  const response = await customInstance<unknown>({
    url: individualSettlementReviewApproveUrl(input.settlementApplicationId),
    method: 'PATCH',
    data: body,
  })
  return unwrapIndividualSettlementReviewDecision(response)
}

export async function rejectIndividualSettlementReviewRemote(input: {
  settlementApplicationId: number
  expectedRevisionNo: number
  reason: string
}): Promise<IndividualSettlementReviewDecision> {
  const reason = input.reason.trim()
  const body: IndividualSettlementReviewRequest = {
    expectedRevisionNo: input.expectedRevisionNo,
    reason,
  }
  const response = await customInstance<unknown>({
    url: individualSettlementReviewRejectUrl(input.settlementApplicationId),
    method: 'PATCH',
    data: body,
  })
  return unwrapIndividualSettlementReviewDecision(response)
}

export function individualSettlementReviewListQueryOptions(input: {
  programId: string
  participantId: string
}) {
  return queryOptions({
    queryKey: generalProgramProgressQueryKeys.individualSettlementReviews(
      input.programId,
      input.participantId
    ),
    staleTime: 30_000,
    queryFn: () =>
      fetchIndividualSettlementReviewListRemote({
        programId: input.programId,
        participantId: input.participantId,
      }),
  })
}

export function individualSettlementReviewDetailQueryOptions(settlementApplicationId: number) {
  return queryOptions({
    queryKey: generalProgramProgressQueryKeys.individualSettlementReviewDetail(
      settlementApplicationId
    ),
    staleTime: 30_000,
    queryFn: () => fetchIndividualSettlementReviewDetailRemote(settlementApplicationId),
  })
}

export function isIndividualSettlementReviewRemoteEnabled(): boolean {
  return shouldUseGeneralProgramProgressRemoteApi()
}
