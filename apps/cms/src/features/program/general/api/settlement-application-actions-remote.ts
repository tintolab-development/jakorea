/**
 * 확정 전 정산 신청서 관리자 액션 — `/api/admin/settlement-applications/{applicationId}/…`
 * applicationId는 정산 목록 행의 settlementApplicationId (settlementId 아님).
 */
import customInstance from '@/shared/api/orval-mutator'
import type { SettlementApplicationAdminActionRequest } from '@/shared/api/generated/settlement/schemas/settlementApplicationAdminActionRequest'
import type { SettlementApplicationConfirmRequest } from '@/shared/api/generated/settlement/schemas/settlementApplicationConfirmRequest'
import type { SettlementApplicationAdminActionResponse } from '@/shared/api/generated/settlement/schemas/settlementApplicationAdminActionResponse'
import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'

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

/** 승인 시 BE가 settlement·payment_statement(WAITING_CONFIRM)를 만들고 그 id를 돌려준다 */
export async function confirmSettlementApplicationRemote(
  applicationId: number,
  body: SettlementApplicationConfirmRequest = {}
): Promise<SettlementApplicationAdminActionResponse | null> {
  const payload = await customInstance<unknown>({
    url: settlementApplicationActionUrl(applicationId, 'confirm'),
    method: 'PATCH',
    data: body,
  })
  return unwrapApiBody<SettlementApplicationAdminActionResponse | null>(payload) ?? null
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
