import { axiosClient } from '@/shared/api/axios-instance'
import type { SettlementApplicationDocumentResponse } from './application-document-types'

export type SettlementApplicationDocumentAttachmentDownload = {
  fileObjectId?: number
  downloadUrl?: string
  expiresAt?: string
  requiredHeaders?: Record<string, string>
}

/**
 * 강사 신청서 GET만 ApiResponse 래퍼를 쓴다.
 * 개인 일정 GET은 SettlementApplicationDocumentResponse 직접 반환 — unwrap 강제 금지.
 */
function unwrapInstructorDocumentEnvelope(payload: unknown): SettlementApplicationDocumentResponse {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    if (record.success === true && 'data' in record) {
      return unwrapInstructorDocumentEnvelope(record.data)
    }
  }
  return payload as SettlementApplicationDocumentResponse
}

export type FetchSettlementApplicationDocumentParams = {
  revisionNo?: number | null
  signal?: AbortSignal
}

/**
 * 영수증(개인 정산) — GET /api/portal/me/individual-settlements/{id}/application-document
 * 성공 본문은 SettlementApplicationDocumentResponse 직접(ApiResponse 래퍼 없음).
 */
export async function fetchIndividualSettlementApplicationDocument(
  settlementApplicationId: number,
  params?: FetchSettlementApplicationDocumentParams
): Promise<SettlementApplicationDocumentResponse> {
  const { data } = await axiosClient.get<SettlementApplicationDocumentResponse>(
    `/api/portal/me/individual-settlements/${settlementApplicationId}/application-document`,
    {
      signal: params?.signal,
      params:
        params?.revisionNo != null && params.revisionNo > 0
          ? { revisionNo: params.revisionNo }
          : undefined,
    }
  )
  return data
}

/**
 * 강사 지급조서 — GET /api/portal/me/settlement-applications/{id}/application-document
 * 성공 본문은 ApiResponse 래퍼 (unwrap).
 */
export async function fetchInstructorSettlementApplicationDocument(
  applicationId: number,
  params?: FetchSettlementApplicationDocumentParams
): Promise<SettlementApplicationDocumentResponse> {
  const { data } = await axiosClient.get<unknown>(
    `/api/portal/me/settlement-applications/${applicationId}/application-document`,
    {
      signal: params?.signal,
      params:
        params?.revisionNo != null && params.revisionNo > 0
          ? { revisionNo: params.revisionNo }
          : undefined,
    }
  )
  return unwrapInstructorDocumentEnvelope(data)
}

/** 정산 신청서 첨부는 현재 회원 포털 파일 다운로드 정책을 사용한다. */
export async function requestSettlementApplicationDocumentAttachmentDownload(
  fileObjectId: number
): Promise<SettlementApplicationDocumentAttachmentDownload> {
  const { data } = await axiosClient.post<unknown>(
    `/api/portal/me/files/${encodeURIComponent(String(fileObjectId))}/download-requests`,
    { purpose: 'settlement-application-document' }
  )
  return unwrapInstructorDocumentEnvelope(data) as SettlementApplicationDocumentAttachmentDownload
}
