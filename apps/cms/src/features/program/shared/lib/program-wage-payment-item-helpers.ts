import { useMemo } from 'react'
import type { SettlementItemSettingSection } from '@/data/mock/settlement-item-settings'
import {
  getTemplateRegistrationPaymentItemOptions,
  useTemplateRegistrationPaymentItemOptions,
} from '@/features/template/lib/template-registration-payment-item-options'
import type { CmsSelectMultipleOption } from '@/shared/ui/cms-select-multiple'

export const PROGRAM_WAGE_PAYMENT_ITEM_NONE_VALUE = '__payment_none__' as const
export const PROGRAM_WAGE_PAYMENT_ITEM_NONE_LABEL = '해당없음' as const
export const PROGRAM_WAGE_DEDUCTION_LABEL = '일용근로자 원천징수세액' as const

const PAYMENT_ITEM_CODE_RE = /^(p|w|d)-\d+$/i

function isPaymentItemCode(text: string | undefined): boolean {
  return Boolean(text && PAYMENT_ITEM_CODE_RE.test(text.trim()))
}

function noneOption(): CmsSelectMultipleOption {
  return {
    value: PROGRAM_WAGE_PAYMENT_ITEM_NONE_VALUE,
    label: PROGRAM_WAGE_PAYMENT_ITEM_NONE_LABEL,
  }
}

function pickBetterPaymentOption(
  current: CmsSelectMultipleOption | undefined,
  incoming: CmsSelectMultipleOption
): CmsSelectMultipleOption {
  const incomingLabel = incoming.label?.trim() || incoming.value
  if (!current) {
    return { ...incoming, label: incomingLabel }
  }
  const currentLabel = current.label?.trim() || current.value
  const incomingIsCode = incomingLabel === incoming.value || isPaymentItemCode(incomingLabel)
  if (incomingIsCode && currentLabel !== current.value && !isPaymentItemCode(currentLabel)) {
    return { ...incoming, label: currentLabel }
  }
  return { ...current, ...incoming, label: incomingIsCode ? currentLabel : incomingLabel }
}

/** mock + 전달 옵션을 합쳐 `p-3` 같은 코드가 라벨 없이 남지 않게 한다 */
export function mergeProgramWagePaymentItemOptions(
  preferred: readonly CmsSelectMultipleOption[] = []
): CmsSelectMultipleOption[] {
  const mock = getTemplateRegistrationPaymentItemOptions()
  const byValue = new Map<string, CmsSelectMultipleOption>()
  for (const option of mock) {
    byValue.set(option.value, pickBetterPaymentOption(byValue.get(option.value), option))
  }
  for (const option of preferred) {
    byValue.set(option.value, pickBetterPaymentOption(byValue.get(option.value), option))
  }
  byValue.set(PROGRAM_WAGE_PAYMENT_ITEM_NONE_VALUE, noneOption())
  return [...byValue.values()]
}

export function getProgramWagePaymentItemOptions(
  sections?: readonly SettlementItemSettingSection[]
): CmsSelectMultipleOption[] {
  return mergeProgramWagePaymentItemOptions(getTemplateRegistrationPaymentItemOptions(sections))
}

/** 정산 항목 설정(지급) 목록 + 「해당없음」 — 등록·상세 편집 UI용 */
export function useProgramWagePaymentItemOptions(): CmsSelectMultipleOption[] {
  const paymentOptions = useTemplateRegistrationPaymentItemOptions()
  return useMemo(() => mergeProgramWagePaymentItemOptions(paymentOptions), [paymentOptions])
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

export function resolveProgramPaymentItemLabel(
  id: string | undefined,
  sections?: readonly SettlementItemSettingSection[]
): string {
  const token = id?.trim() ?? ''
  if (!token) return ''
  if (token === PROGRAM_WAGE_PAYMENT_ITEM_NONE_VALUE) return PROGRAM_WAGE_PAYMENT_ITEM_NONE_LABEL
  const options = getProgramWagePaymentItemOptions(sections)
  return options.find(o => o.value === token)?.label || (isPaymentItemCode(token) ? token : token)
}

export function programPaymentItemLabelsFromIds(
  ids: string[] | undefined,
  sections?: readonly SettlementItemSettingSection[]
): string {
  if (!ids?.length) return ''
  if (isProgramPaymentNoneOnly(ids)) return PROGRAM_WAGE_PAYMENT_ITEM_NONE_LABEL
  return ids
    .map(id => resolveProgramPaymentItemLabel(id, sections))
    .filter(Boolean)
    .join(', ')
}

export function resolveProgramPaymentItemIdsFromLabels(
  paymentItems: string | undefined,
  sections?: readonly SettlementItemSettingSection[]
): string[] {
  if (!paymentItems?.trim()) return []
  if (
    paymentItems.trim() === PROGRAM_WAGE_PAYMENT_ITEM_NONE_LABEL ||
    paymentItems.includes('해당없음')
  ) {
    return [PROGRAM_WAGE_PAYMENT_ITEM_NONE_VALUE]
  }
  const options = getProgramWagePaymentItemOptions(sections)
  return paymentItems
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(token => {
      const byValue = options.find(o => o.value === token)
      if (byValue) return byValue.value
      return options.find(o => o.label === token || token.includes(String(o.label)))?.value
    })
    .filter((v): v is string => Boolean(v))
}

export function normalizeProgramPaymentItemSelection(next: string[], prev: string[]): string[] {
  const none = PROGRAM_WAGE_PAYMENT_ITEM_NONE_VALUE
  if (next.includes(none) && !prev.includes(none)) return [none]
  if (next.length > 1 && next.includes(none)) return next.filter(v => v !== none)
  return next
}
