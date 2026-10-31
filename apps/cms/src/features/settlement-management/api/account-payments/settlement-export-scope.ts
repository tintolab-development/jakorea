import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import customInstance from '@/shared/api/orval-mutator'
import type { Scope, SettlementExportRequest } from '@/shared/api/generated/settlement/schemas'
import {
  ACCOUNT_PAYMENT_EXPORT_STATUS_PAID,
  ACCOUNT_PAYMENT_EXPORT_STATUS_WAITING_PAYMENT,
  buildAccountPaymentExportRequest,
  buildRawAccountPaymentExportRequest,
} from './build-account-payment-export-request'
import type { AccountPaymentRow } from '@/features/settlement-management/model/account-payments-list'

export type SettlementExportType = 'BULK_TRANSFER' | 'TAX_REPORT'

export type SettlementExportScope = Scope

const SCOPE_REASON = '계좌 지급 확인 — 원본 발급 범위 확인'
const SCOPE_PURPOSE = '정산 관리 대량이체·세금신고 원본 양식'

export function exportTypeForKind(kind: 'bulk-transfer' | 'tax-report'): SettlementExportType {
  return kind === 'bulk-transfer' ? 'BULK_TRANSFER' : 'TAX_REPORT'
}

/** 무필터 전체 원본 범위. 서버가 유형별 지급 대기/완료를 적용한다. */
export function buildFullCorpusScopeRequest(_kind: 'bulk-transfer' | 'tax-report'): SettlementExportRequest {
  return {
    reason: SCOPE_REASON,
    businessPurpose: SCOPE_PURPOSE,
    settlementIds: [],
    accountPaymentIds: [],
  }
}

export function buildSelectedScopeRequest(input: {
  kind: 'bulk-transfer' | 'tax-report'
  rows: ReadonlyArray<Pick<AccountPaymentRow, 'settlementId' | 'accountPaymentId'>>
}): SettlementExportRequest {
  const masked = buildAccountPaymentExportRequest({
    kind: input.kind,
    selection: { kind: 'selected', rows: input.rows },
  })
  return {
    reason: SCOPE_REASON,
    businessPurpose: SCOPE_PURPOSE,
    settlementIds: masked.settlementIds ?? [],
    ...(input.kind === 'bulk-transfer' ? { accountPaymentIds: masked.accountPaymentIds ?? [] } : {}),
  }
}

export async function issueSettlementExportScopeRemote(
  exportType: SettlementExportType,
  body: SettlementExportRequest
): Promise<SettlementExportScope> {
  return unwrapApiBody(
    await customInstance<SettlementExportScope>({
      url: '/api/admin/settlements/exports/scope',
      method: 'POST',
      params: { exportType },
      data: body,
    })
  )
}

export function isScopeExpired(scope: SettlementExportScope, nowEpochSecond = Math.floor(Date.now() / 1000)): boolean {
  return scope.expiresAtEpochSecond != null && scope.expiresAtEpochSecond <= nowEpochSecond
}

export function assertUsableScopeToken(scope: SettlementExportScope): string {
  const token = scope.scopeToken?.trim() ?? ''
  if (!token) {
    throw new Error('서버 scopeToken이 없습니다. 선택 원본 발급을 진행하지 않습니다.')
  }
  if (isScopeExpired(scope)) {
    throw new Error('발급 범위 확인이 만료되었습니다. 범위를 다시 확인해 주세요.')
  }
  return token
}

export function buildRawExportBodyForScope(input: {
  kind: 'bulk-transfer' | 'tax-report'
  approvalReference: string
  fullCorpus: boolean
  selectedRows?: ReadonlyArray<Pick<AccountPaymentRow, 'settlementId' | 'accountPaymentId'>>
}) {
  const base = buildRawAccountPaymentExportRequest({
    kind: input.kind,
    approvalReference: input.approvalReference,
  })
  if (input.fullCorpus) return base
  if (input.selectedRows == null || input.selectedRows.length === 0) {
    throw new Error('선택 원본 발급은 서버 scopeToken과 같은 선택 건이 필요합니다.')
  }
  const selected = buildAccountPaymentExportRequest({
    kind: input.kind,
    selection: { kind: 'selected', rows: input.selectedRows },
  })
  return {
    ...base,
    settlementIds: selected.settlementIds ?? [],
    ...(input.kind === 'bulk-transfer' ? { accountPaymentIds: selected.accountPaymentIds ?? [] } : {}),
  }
}

export function expectedStatusLabel(kind: 'bulk-transfer' | 'tax-report', effectiveStatus?: string | null): string {
  const status = effectiveStatus?.trim() || (
    kind === 'bulk-transfer'
      ? ACCOUNT_PAYMENT_EXPORT_STATUS_WAITING_PAYMENT
      : ACCOUNT_PAYMENT_EXPORT_STATUS_PAID
  )
  return status === ACCOUNT_PAYMENT_EXPORT_STATUS_PAID ? '지급 완료' : '지급 대기'
}
