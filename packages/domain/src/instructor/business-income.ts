import { getLabel } from '../shared/option-helpers.js'
import type { DomainSelectOption } from '../shared/types.js'

export const BUSINESS_INCOME = {
  yes: 'yes',
  no: 'no',
} as const

export type BusinessIncome = (typeof BUSINESS_INCOME)[keyof typeof BUSINESS_INCOME]

export const BUSINESS_INCOME_OPTIONS: DomainSelectOption<BusinessIncome>[] = [
  { value: BUSINESS_INCOME.yes, label: '해당' },
  { value: BUSINESS_INCOME.no, label: '해당 없음' },
]

export function getBusinessIncomeLabel(value: BusinessIncome): string {
  return getLabel(BUSINESS_INCOME_OPTIONS, value)
}
