import { getTemplateRegistrationPaymentItemOptions } from '@/features/template/lib/template-registration-payment-item-options'
import type { CmsSelectMultipleOption } from '@/shared/ui/cms-select-multiple'

export const PROGRAM_WAGE_PAYMENT_ITEM_NONE_VALUE = '__payment_none__' as const
export const PROGRAM_WAGE_PAYMENT_ITEM_NONE_LABEL = '해당없음' as const
export const PROGRAM_WAGE_DEDUCTION_LABEL = '일용근로자 원천징수세액' as const

export function getProgramWagePaymentItemOptions(): CmsSelectMultipleOption[] {
  return [
    ...getTemplateRegistrationPaymentItemOptions(),
    { value: PROGRAM_WAGE_PAYMENT_ITEM_NONE_VALUE, label: PROGRAM_WAGE_PAYMENT_ITEM_NONE_LABEL },
  ]
}

export function isProgramPaymentNoneOnly(ids: string[] | undefined): boolean {
  return ids?.length === 1 && ids[0] === PROGRAM_WAGE_PAYMENT_ITEM_NONE_VALUE
}

export function resolveProgramWageDeductionLabel(paymentItemIds: string[] | undefined): string {
  if (isProgramPaymentNoneOnly(paymentItemIds)) return PROGRAM_WAGE_PAYMENT_ITEM_NONE_LABEL
  if (!paymentItemIds?.length) return PROGRAM_WAGE_PAYMENT_ITEM_NONE_LABEL
  if (paymentItemIds.includes(PROGRAM_WAGE_PAYMENT_ITEM_NONE_VALUE)) {
    return PROGRAM_WAGE_PAYMENT_ITEM_NONE_LABEL
  }
  return PROGRAM_WAGE_DEDUCTION_LABEL
}

export function programPaymentItemLabelsFromIds(ids: string[] | undefined): string {
  if (!ids?.length) return ''
  if (isProgramPaymentNoneOnly(ids)) return PROGRAM_WAGE_PAYMENT_ITEM_NONE_LABEL
  const options = getProgramWagePaymentItemOptions()
  return ids
    .map(id => options.find(o => o.value === id)?.label)
    .filter(Boolean)
    .join(', ')
}

export function resolveProgramPaymentItemIdsFromLabels(
  paymentItems: string | undefined
): string[] {
  if (!paymentItems?.trim()) return []
  if (
    paymentItems.trim() === PROGRAM_WAGE_PAYMENT_ITEM_NONE_LABEL ||
    paymentItems.includes('해당없음')
  ) {
    return [PROGRAM_WAGE_PAYMENT_ITEM_NONE_VALUE]
  }
  const options = getProgramWagePaymentItemOptions()
  return paymentItems
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(label => options.find(o => o.label === label || label.includes(String(o.label)))?.value)
    .filter((v): v is string => Boolean(v))
}

export function normalizeProgramPaymentItemSelection(next: string[], prev: string[]): string[] {
  const none = PROGRAM_WAGE_PAYMENT_ITEM_NONE_VALUE
  if (next.includes(none) && !prev.includes(none)) return [none]
  if (next.length > 1 && next.includes(none)) return next.filter(v => v !== none)
  return next
}
