import { formatResidentNumberRawForPreview } from '@jakorea/form-schema/consent'
import { fetchSettlementDetailRemote } from '@/features/settlement-management/api/settlement-api-client'
import type { AccountPaymentRow } from '@/features/settlement-management/model/account-payments-list'

function isSettlementId(value: number | undefined): value is number {
  return value != null && Number.isSafeInteger(value) && value > 0
}

/** 정산 상세 MASKED payee 주민번호. 마스킹 값을 원문으로 복원하지 않는다. */
export function formatTaxFilingPreviewResidentId(raw: string | null | undefined): string {
  const formatted = formatResidentNumberRawForPreview(raw ?? undefined)
  return formatted.trim() || '-'
}

export async function loadTaxFilingMaskedResidentNumbers(
  rows: ReadonlyArray<Pick<AccountPaymentRow, 'settlementId'>>
): Promise<Map<number, string>> {
  const ids = [
    ...new Set(rows.map(row => row.settlementId).filter(isSettlementId)),
  ]
  const entries = await Promise.all(
    ids.map(async (settlementId): Promise<[number, string] | null> => {
      const detail = await fetchSettlementDetailRemote(settlementId)
      const masked = formatTaxFilingPreviewResidentId(
        detail.payee?.residentRegistrationNumber
      )
      if (masked === '-') return null
      return [settlementId, masked]
    })
  )
  return new Map(entries.filter((entry): entry is [number, string] => entry != null))
}

export function applyTaxFilingMaskedResidentNumbers(
  rows: AccountPaymentRow[],
  maskedBySettlementId: Map<number, string>
): AccountPaymentRow[] {
  return rows.map(row => {
    if (row.settlementId == null) return row
    const masked = maskedBySettlementId.get(row.settlementId)
    if (!masked) return row
    return { ...row, residentRegistrationNumberMasked: masked }
  })
}
