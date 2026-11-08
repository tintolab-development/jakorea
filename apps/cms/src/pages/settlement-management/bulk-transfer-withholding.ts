import { fetchSettlementDetailRemote } from '@/features/settlement-management/api/settlement-api-client'
import type { AccountPaymentRow } from '@/features/settlement-management/model/account-payments-list'
import type { SettlementFrontendResponse } from '@/shared/api/generated/settlement/schemas'

function isSettlementId(value: number | undefined): value is number {
  return value != null && Number.isSafeInteger(value) && value > 0
}

/** 정산 상세 withholding 항목 합. 세율을 프론트에서 계산하지 않는다. */
export function withholdingTaxAmountFromSettlementDetail(
  detail: Pick<SettlementFrontendResponse, 'items'>
): number {
  let sum = 0
  for (const item of detail.items ?? []) {
    if (item.type !== 'withholding') continue
    const amount = item.amount
    if (typeof amount !== 'number' || !Number.isFinite(amount)) continue
    sum += Math.abs(amount)
  }
  return sum
}

export async function loadBulkTransferWithholdingAmounts(
  rows: ReadonlyArray<Pick<AccountPaymentRow, 'settlementId'>>
): Promise<Map<number, number>> {
  const ids = [...new Set(rows.map(row => row.settlementId).filter(isSettlementId))]
  const entries = await Promise.all(
    ids.map(async (settlementId): Promise<[number, number] | null> => {
      const detail = await fetchSettlementDetailRemote(settlementId)
      const amount = withholdingTaxAmountFromSettlementDetail(detail)
      if (amount <= 0) return null
      return [settlementId, amount]
    })
  )
  return new Map(entries.filter((entry): entry is [number, number] => entry != null))
}

export function applyBulkTransferWithholdingAmounts(
  rows: AccountPaymentRow[],
  withholdingBySettlementId: Map<number, number>
): AccountPaymentRow[] {
  return rows.map(row => {
    if (row.settlementId == null) return row
    const withholdingTaxAmount = withholdingBySettlementId.get(row.settlementId)
    if (withholdingTaxAmount == null) return row
    return { ...row, withholdingTaxAmount }
  })
}
