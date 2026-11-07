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

export const BUSINESS_INCOME_DISPLAY_YES = '해당'
export const BUSINESS_INCOME_DISPLAY_NO = '해당 없음'

export type BusinessIncomeDisplayLabel =
  | typeof BUSINESS_INCOME_DISPLAY_YES
  | typeof BUSINESS_INCOME_DISPLAY_NO

const BUSINESS_INCOME_YES_ALIASES = new Set(['해당', '사업소득자', 'y', 'yes', 'true'])
const BUSINESS_INCOME_NO_ALIASES = new Set([
  '해당 없음',
  '해당없음',
  '사업소득자 아님',
  '비사업소득자',
  'n',
  'no',
  'false',
])

/**
 * 사업소득자 여부 표시 SSOT (CMS·Platform 공통) — `해당` | `해당 없음`.
 * boolean·BE 라벨 변형(`사업소득자`/`사업소득자 아님` 등)을 같은 문구로 맞춘다.
 * 값이 없거나 해석할 수 없으면 null → 렌더 레이어에서 `-`.
 */
export function formatBusinessIncomeDisplay(
  value: boolean | string | null | undefined
): BusinessIncomeDisplayLabel | null {
  if (typeof value === 'boolean') {
    return value ? BUSINESS_INCOME_DISPLAY_YES : BUSINESS_INCOME_DISPLAY_NO
  }
  const normalized = value?.trim().toLowerCase()
  if (!normalized) return null
  if (BUSINESS_INCOME_YES_ALIASES.has(normalized)) return BUSINESS_INCOME_DISPLAY_YES
  if (BUSINESS_INCOME_NO_ALIASES.has(normalized)) return BUSINESS_INCOME_DISPLAY_NO
  return null
}
