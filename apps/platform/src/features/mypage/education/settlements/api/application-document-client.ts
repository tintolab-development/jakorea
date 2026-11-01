import { axiosClient } from '@/shared/api/axios-instance'
import type { SettlementApplicationDocumentResponse } from './application-document-types'

function unwrapEnvelope<T>(payload: unknown): T {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    if (record.success === true && 'data' in record) {
      return unwrapEnvelope<T>(record.data)
    }
  }
  return payload as T
}

export type FetchSettlementApplicationDocumentParams = {
  revisionNo?: number | null
  signal?: AbortSignal
}

/**
 * 영수증(개인 정산) — GET /api/portal/me/individual-settlements/{id}/application-document
 * 성공 본문은 SettlementApplicationDocumentResponse 직접(unwrapped).
 */
export async function fetchIndividualSettlementApplicationDocument(
  settlementApplicationId: number,
  params?: FetchSettlementApplicationDocumentParams,
): Promise<SettlementApplicationDocumentResponse> {
  const { data } = await axiosClient.get<unknown>(
    `/api/portal/me/individual-settlements/${settlementApplicationId}/application-document`,
    {
      signal: params?.signal,
      params:
        params?.revisionNo != null && params.revisionNo > 0
          ? { revisionNo: params.revisionNo }
          : undefined,
    },
  )
  return unwrapEnvelope<SettlementApplicationDocumentResponse>(data)
}

/**
 * 강사 지급조서 — GET /api/portal/me/settlement-applications/{id}/application-document
 * 성공 본문은 ApiResponse 래퍼 (unwrap).
 */
export async function fetchInstructorSettlementApplicationDocument(
  applicationId: number,
  params?: FetchSettlementApplicationDocumentParams,
): Promise<SettlementApplicationDocumentResponse> {
  const { data } = await axiosClient.get<unknown>(
    `/api/portal/me/settlement-applications/${applicationId}/application-document`,
    {
      signal: params?.signal,
      params:
        params?.revisionNo != null && params.revisionNo > 0
          ? { revisionNo: params.revisionNo }
          : undefined,
    },
  )
  return unwrapEnvelope<SettlementApplicationDocumentResponse>(data)
}
