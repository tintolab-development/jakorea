import type { SettlementExportRequest } from '@/shared/api/generated/settlement/schemas'
import type { AccountPaymentRow } from '@/features/settlement-management/model/account-payments-list'

/** 대량이체·세금신고 모두 지급 완료 건만 서버가 허용한다. */
export const ACCOUNT_PAYMENT_EXPORT_STATUS_PAID = 'PAID' as const

const EXPORT_REASON = '계좌 지급 확인 — 양식 발급'
const EXPORT_BUSINESS_PURPOSE = '정산 관리 대량이체·세금신고 양식'

export type BuildAccountPaymentExportRequestInput = {
  fromDate?: string
  toDate?: string
  kind: 'bulk-transfer' | 'tax-report'
  selection:
    | { kind: 'selected'; rows: ReadonlyArray<Pick<AccountPaymentRow, 'settlementId' | 'accountPaymentId'>> }
    | { kind: 'all' }
}

function isValidId(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0
}

function resolveSelectedIds(
  rows: ReadonlyArray<Pick<AccountPaymentRow, 'settlementId' | 'accountPaymentId'>>
) {
  const settlementIds = new Set<number>()
  const accountPaymentIds = new Set<number>()

  for (const row of rows) {
    if (row.settlementId != null) {
      if (isValidId(row.settlementId)) settlementIds.add(row.settlementId)
      continue
    }
    if (isValidId(row.accountPaymentId)) accountPaymentIds.add(row.accountPaymentId)
  }

  return {
    settlementIds: [...settlementIds],
    accountPaymentIds: [...accountPaymentIds],
  }
}

/**
 * 대량이체·세금신고 export body.
 * 선택 모드에서는 선택한 원장 ID만 전송하고, 전체 모드에서만 두 ID 배열을 비운다.
 */
export function buildAccountPaymentExportRequest(
  input: BuildAccountPaymentExportRequestInput
): SettlementExportRequest {
  const label =
    input.kind === 'bulk-transfer' ? '대량이체 양식 발급' : '세금신고 양식 발급'
  const selectedIds =
    input.selection.kind === 'selected' ? resolveSelectedIds(input.selection.rows) : undefined
  return {
    status: ACCOUNT_PAYMENT_EXPORT_STATUS_PAID,
    reason: `${EXPORT_REASON} (${label})`,
    businessPurpose: EXPORT_BUSINESS_PURPOSE,
    settlementIds: selectedIds?.settlementIds ?? [],
    ...(input.kind === 'bulk-transfer'
      ? { accountPaymentIds: selectedIds?.accountPaymentIds ?? [] }
      : {}),
    ...(input.fromDate || input.toDate
      ? {
          ...(input.fromDate ? { fromDate: input.fromDate } : {}),
          ...(input.toDate ? { toDate: input.toDate } : {}),
          dateRangeValid: true,
        }
      : {}),
  }
}
