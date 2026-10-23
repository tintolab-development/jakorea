import type { SettlementItemSettingRow, SettlementItemSettingSection } from '@/features/settlement-management/model/settlement-item-settings'
import type { CmsSelectMultipleOption } from '@/shared/ui/cms-select-multiple'
import { PROGRAM_WAGE_PAYMENT_ITEM_NONE_VALUE } from '@/features/program/shared/lib/program-wage-payment-item-helpers'

/** BE `PaymentItemResponse.eligiblePayeeTypes` */
export type SettlementEligiblePayeeType =
  | 'STUDENT'
  | 'PARTICIPANT_INDIVIDUAL'
  | 'PARTICIPANT_ORGANIZATION'
  | 'INSTRUCTOR'

export const GENERAL_PROGRAM_PARTICIPANT_PAYEE_TYPES: readonly SettlementEligiblePayeeType[] = [
  'STUDENT',
  'PARTICIPANT_INDIVIDUAL',
  'PARTICIPANT_ORGANIZATION',
]

const INSTRUCTOR_ONLY_PAYMENT_TYPES = new Set([
  'TRANSPORT_INSTRUCTOR',
  'LODGING_GENERAL',
  'LODGING_1C1S',
])

const PARTICIPANT_PAYMENT_TYPES = new Set([
  'TRANSPORT_STUDENT',
  'STUDENT_TRANSPORTATION',
  'ACTIVITY',
  'MEAL',
])

export function readPaymentItemEligiblePayeeTypes(item: unknown): SettlementEligiblePayeeType[] {
  if (!item || typeof item !== 'object') return []
  const raw = (item as { eligiblePayeeTypes?: unknown }).eligiblePayeeTypes
  if (!Array.isArray(raw)) return []
  return raw
    .map(v => (typeof v === 'string' ? v.trim().toUpperCase() : ''))
    .filter((v): v is SettlementEligiblePayeeType =>
      v === 'STUDENT' ||
      v === 'PARTICIPANT_INDIVIDUAL' ||
      v === 'PARTICIPANT_ORGANIZATION' ||
      v === 'INSTRUCTOR'
    )
}

function rowMatchesPayee(
  row: SettlementItemSettingRow,
  payeeTypes: ReadonlySet<SettlementEligiblePayeeType>
): boolean {
  const explicit = row.eligiblePayeeTypes
  if (explicit?.length) {
    return explicit.some(t => payeeTypes.has(t))
  }
  const paymentType = (row.paymentItemType ?? '').trim().toUpperCase()
  if (INSTRUCTOR_ONLY_PAYMENT_TYPES.has(paymentType)) {
    return payeeTypes.has('INSTRUCTOR')
  }
  if (PARTICIPANT_PAYMENT_TYPES.has(paymentType)) {
    return GENERAL_PROGRAM_PARTICIPANT_PAYEE_TYPES.some(t => payeeTypes.has(t))
  }
  return true
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
