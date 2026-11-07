/**
 * 확정 전 정산 신청서 관리자 액션 — `/api/admin/settlement-applications/{applicationId}/…`
 * applicationId는 정산 목록 행의 settlementApplicationId (settlementId 아님).
 */
import customInstance from '@/shared/api/orval-mutator'
import type { SettlementApplicationAdminActionRequest } from '@/shared/api/generated/settlement/schemas/settlementApplicationAdminActionRequest'
import type { SettlementApplicationConfirmRequest } from '@/shared/api/generated/settlement/schemas/settlementApplicationConfirmRequest'

/** 서버 availableActions 코드 */
export const SETTLEMENT_APPLICATION_ACTIONS = {
  confirm: 'CONFIRM_SETTLEMENT_APPLICATION',
  reject: 'REJECT_SETTLEMENT_APPLICATION',
  requestCorrection: 'REQUEST_CORRECTION',
} as const

export type SettlementApplicationActionKind = keyof typeof SETTLEMENT_APPLICATION_ACTIONS

function settlementApplicationActionUrl(applicationId: number, suffix: string): string {
  return `/api/admin/settlement-applications/${encodeURIComponent(String(applicationId))}/${suffix}`
}

export async function confirmSettlementApplicationRemote(
  applicationId: number,
  body: SettlementApplicationConfirmRequest = {}
): Promise<void> {
  await customInstance({
    url: settlementApplicationActionUrl(applicationId, 'confirm'),
    method: 'PATCH',
    data: body,
  })
}

export async function rejectSettlementApplicationRemote(
  applicationId: number,
  body: SettlementApplicationAdminActionRequest
): Promise<void> {
  await customInstance({
    url: settlementApplicationActionUrl(applicationId, 'reject'),
    method: 'PATCH',
    data: body,
  })
}

export async function requestSettlementApplicationCorrectionRemote(
  applicationId: number,
  body: SettlementApplicationAdminActionRequest
): Promise<void> {
  await customInstance({
    url: settlementApplicationActionUrl(applicationId, 'request-correction'),
    method: 'PATCH',
    data: body,
  })
}
