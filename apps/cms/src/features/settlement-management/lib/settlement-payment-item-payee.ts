import type { SettlementItemSettingRow, SettlementItemSettingSection } from '@/features/settlement-management/model/settlement-item-settings'
import type { CmsSelectMultipleOption } from '@/shared/ui/cms-select-multiple'
import { PROGRAM_WAGE_PAYMENT_ITEM_NONE_VALUE } from '@/features/program/shared/lib/program-wage-payment-item-helpers'

/** BE `PaymentItemResponse.eligiblePayeeTypes` */
export type SettlementEligiblePayeeType =
  | 'STUDENT'
  | 'PARTICIPANT_INDIVIDUAL'
  | 'PARTICIPANT_ORGANIZATION'
  | 'INSTRUCTOR'
  | 'VOLUNTEER'

const SETTLEMENT_ELIGIBLE_PAYEE_TYPES: ReadonlySet<string> = new Set<SettlementEligiblePayeeType>([
  'STUDENT',
  'PARTICIPANT_INDIVIDUAL',
  'PARTICIPANT_ORGANIZATION',
  'INSTRUCTOR',
  'VOLUNTEER',
])

export const GENERAL_PROGRAM_PARTICIPANT_PAYEE_TYPES: readonly SettlementEligiblePayeeType[] = [
  'STUDENT',
  'PARTICIPANT_INDIVIDUAL',
  'PARTICIPANT_ORGANIZATION',
]

export function readPaymentItemEligiblePayeeTypes(item: unknown): SettlementEligiblePayeeType[] {
  if (!item || typeof item !== 'object') return []
  const raw = (item as { eligiblePayeeTypes?: unknown }).eligiblePayeeTypes
  if (!Array.isArray(raw)) return []
  return raw
    .map(v => (typeof v === 'string' ? v.trim().toUpperCase() : ''))
    .filter((v): v is SettlementEligiblePayeeType => SETTLEMENT_ELIGIBLE_PAYEE_TYPES.has(v))
}

/**
 * 지급 대상은 서버 `eligiblePayeeTypes`만 따른다(항목 유형으로 추론하지 않는다).
 * 값이 없는 행(로컬 mock 등)은 거르지 않는다.
 */
function rowMatchesPayee(
  row: SettlementItemSettingRow,
  payeeTypes: ReadonlySet<SettlementEligiblePayeeType>
): boolean {
  const explicit = row.eligiblePayeeTypes
  if (!explicit?.length) return true
  return explicit.some(t => payeeTypes.has(t))
}

function paymentRowsFromSections(
  sections: readonly SettlementItemSettingSection[] | undefined
): SettlementItemSettingRow[] {
  const fromSections = sections?.find(s => s.kind === 'payment')?.items
  if (fromSections?.length) return fromSections
  return []
}

/** 프로그램 등록·공통정보 — payee에 맞는 지급 항목만 노출 */
export function filterProgramWagePaymentItemOptionsForPayees(
  options: readonly CmsSelectMultipleOption[],
  sections: readonly SettlementItemSettingSection[] | undefined,
  payees: readonly SettlementEligiblePayeeType[]
): CmsSelectMultipleOption[] {
  const payeeSet = new Set(payees)
  const allowedIds = new Set(
    paymentRowsFromSections(sections)
      .filter(row => rowMatchesPayee(row, payeeSet))
      .map(row => row.id)
  )
  return options.filter(
    opt =>
      opt.value === PROGRAM_WAGE_PAYMENT_ITEM_NONE_VALUE || allowedIds.has(String(opt.value))
  )
}
