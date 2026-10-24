import { queryOptions } from '@tanstack/react-query'
import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import { generalProgramProgressQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'
import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { customInstance } from '@/shared/api/orval-mutator'
import type { ApiResponseIndividualSettlementReviewDecision } from '@/shared/api/generated/dashboard/schemas/apiResponseIndividualSettlementReviewDecision'
import type { ApiResponseIndividualSettlementReviewDetail } from '@/shared/api/generated/dashboard/schemas/apiResponseIndividualSettlementReviewDetail'
import type { IndividualSettlementReviewDecision } from '@/shared/api/generated/dashboard/schemas/individualSettlementReviewDecision'
import type { IndividualSettlementReviewDetail } from '@/shared/api/generated/dashboard/schemas/individualSettlementReviewDetail'
import type { IndividualSettlementReviewRequest } from '@/shared/api/generated/dashboard/schemas/individualSettlementReviewRequest'
import type { IndividualSettlementRejectRequest } from '@/shared/api/generated/dashboard/schemas/individualSettlementRejectRequest'
import type { IndividualSettlementReviewListItem } from '@/shared/api/generated/dashboard/schemas/individualSettlementReviewListItem'
import type { PageResponseIndividualSettlementReviewListItem } from '@/shared/api/generated/dashboard/schemas/pageResponseIndividualSettlementReviewListItem'

function parseNumericId(value: string | number | undefined | null): number | null {
  if (value == null || value === '') return null
  const n = typeof value === 'number' ? value : Number(String(value).trim())
  return Number.isFinite(n) && n > 0 ? n : null
}

export async function fetchIndividualSettlementReviewPageRemote(input: {
  programId: string | number
  participantId: string | number
  status?: string
  page?: number
  size?: number
}): Promise<PageResponseIndividualSettlementReviewListItem> {
  const programId = parseNumericId(input.programId)
  const participantId = parseNumericId(input.participantId)
  if (programId == null || participantId == null) {
    return { items: [], page: input.page ?? 0, size: input.size ?? 100, totalElements: 0, totalPages: 0 }
  }

  return customInstance<PageResponseIndividualSettlementReviewListItem>({
    url: '/api/admin/individual-settlement-applications',
    method: 'GET',
    params: {
      programId,
      participantId,
      ...(input.status?.trim() ? { status: input.status.trim() } : {}),
      page: input.page ?? 0,
      size: input.size ?? 100,
    },
  })
}

export async function fetchIndividualSettlementReviewListRemote(input: {
  programId: string | number
  participantId: string | number
  status?: string
}): Promise<IndividualSettlementReviewListItem[]> {
  const page = await fetchIndividualSettlementReviewPageRemote({ ...input, page: 0, size: 100 })
  return page.items ?? []
}

export async function fetchIndividualSettlementReviewDetailRemote(
  settlementApplicationId: number
): Promise<IndividualSettlementReviewDetail> {
  const response = await customInstance<ApiResponseIndividualSettlementReviewDetail>({
    url: `/api/admin/individual-settlement-applications/${settlementApplicationId}`,
    method: 'GET',
  })
  return unwrapApiBody<IndividualSettlementReviewDetail>(response)
}

export async function approveIndividualSettlementReviewRemote(
  settlementApplicationId: number,
  expectedRevisionNo: number
): Promise<IndividualSettlementReviewDecision> {
  const body: IndividualSettlementReviewRequest = { expectedRevisionNo }
  const response = await customInstance<ApiResponseIndividualSettlementReviewDecision>({
    url: `/api/admin/individual-settlement-applications/${settlementApplicationId}/approve`,
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    data: body,
  })
  return unwrapApiBody<IndividualSettlementReviewDecision>(response)
}

export async function rejectIndividualSettlementReviewRemote(
  settlementApplicationId: number,
  body: IndividualSettlementRejectRequest
): Promise<IndividualSettlementReviewDecision> {
  const response = await customInstance<ApiResponseIndividualSettlementReviewDecision>({
    url: `/api/admin/individual-settlement-applications/${settlementApplicationId}/reject`,
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    data: body,
  })
  return unwrapApiBody<IndividualSettlementReviewDecision>(response)
}

export function individualSettlementReviewQueryOptions(input: {
  programId: string
  participantId: string
}) {
  return queryOptions({
    queryKey: generalProgramProgressQueryKeys.participantSettlements(
      input.programId,
      input.participantId
    ),
    staleTime: 30_000,
    queryFn: () => fetchIndividualSettlementReviewListRemote(input),
  })
}

/** CMS의 기존 정산 원장 게이트와 동일한 인증·실 API 조건을 사용한다. */
export function isIndividualSettlementReviewRemoteEnabled(): boolean {
  return isRealApiModuleEnabled('paymentOrders') && hasRemoteAdminJwt()
}
