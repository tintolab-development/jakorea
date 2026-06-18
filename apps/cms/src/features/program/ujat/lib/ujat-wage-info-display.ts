import { settlementItemSettingSections } from '@/data/mock/settlement-item-settings'
import type { Program } from '@/types/domain'
import {
  getProgramWagePaymentItemOptions,
  isProgramPaymentNoneOnly,
  normalizeProgramPaymentItemSelection,
  PROGRAM_WAGE_DEDUCTION_LABEL,
  PROGRAM_WAGE_PAYMENT_ITEM_NONE_LABEL,
  PROGRAM_WAGE_PAYMENT_ITEM_NONE_VALUE,
  programPaymentItemLabelsFromIds,
  resolveProgramPaymentItemIdsFromLabels,
  resolveProgramWageDeductionLabel,
} from '@/features/program/shared/lib/program-wage-payment-item-helpers'

/** UJAT 임금 정보 — 지급 항목「해당없음」선택값 (공유 상수 alias) */
export const UJAT_WAGE_PAYMENT_ITEM_NONE_VALUE = PROGRAM_WAGE_PAYMENT_ITEM_NONE_VALUE
export const UJAT_WAGE_PAYMENT_ITEM_NONE_LABEL = PROGRAM_WAGE_PAYMENT_ITEM_NONE_LABEL
export const UJAT_WAGE_DEDUCTION_LABEL = PROGRAM_WAGE_DEDUCTION_LABEL
export const UJAT_WAGE_OVERLAY_PAYMENT_KEY = 'ujat.wage.paymentItemValues' as const

/** UJAT 등록 양식 기본 지급 항목 — mock `교통비` (id `p-1`) */
export const UJAT_DEFAULT_PAYMENT_ITEM_VALUES: string[] = ['p-1']

export type UjatWageInfoDisplay = {
  paymentItemsText: string
  deductionItemsText: string
  paymentItemIds: string[]
}

export const getUjatWagePaymentItemOptions = getProgramWagePaymentItemOptions
export const isUjatPaymentNoneOnly = isProgramPaymentNoneOnly
export const resolveUjatWageDeductionLabel = resolveProgramWageDeductionLabel
export const ujatPaymentItemLabelsFromIds = programPaymentItemLabelsFromIds
export const normalizeUjatPaymentItemSelection = normalizeProgramPaymentItemSelection

function readPaymentItemIdsFromOverlay(overlay: Record<string, unknown>): string[] | undefined {
  const raw = overlay[UJAT_WAGE_OVERLAY_PAYMENT_KEY]
  if (!Array.isArray(raw)) return undefined
  return raw.filter((v): v is string => typeof v === 'string')
}

export function resolveUjatPaymentItemIdsFromProgram(
  program: Program,
  overlayInput?: Record<string, unknown>
): string[] {
  const fromOverlay = overlayInput ? readPaymentItemIdsFromOverlay(overlayInput) : undefined
  if (fromOverlay?.length) return fromOverlay

  const labels = program.generalCommonInfo?.paymentItems?.trim() || ''
  if (!labels) return [...UJAT_DEFAULT_PAYMENT_ITEM_VALUES]

  const fromLabels = resolveProgramPaymentItemIdsFromLabels(labels)
  if (fromLabels.length > 0) return fromLabels

  const options = getUjatWagePaymentItemOptions()
  const resolved = labels
    .split(',')
    .map((s: string) => s.trim())
    .filter(Boolean)
    .map((label: string) => {
      const exact = options.find(o => o.label === label)
      if (exact) return exact.value
      const section = settlementItemSettingSections.find(s => s.kind === 'payment')
      const row = section?.items.find(item => label.includes(item.title))
      return row?.id
    })
    .filter((v: string | undefined): v is string => Boolean(v))

  return resolved.length > 0 ? resolved : [...UJAT_DEFAULT_PAYMENT_ITEM_VALUES]
}

export function resolveUjatWageInfoDisplay(
  program: Program,
  overlayInput?: Record<string, unknown>
): UjatWageInfoDisplay {
  const paymentItemIds = resolveUjatPaymentItemIdsFromProgram(program, overlayInput)
  return {
    paymentItemIds,
    paymentItemsText: ujatPaymentItemLabelsFromIds(paymentItemIds) || '-',
    deductionItemsText: resolveUjatWageDeductionLabel(paymentItemIds),
  }
}

export function readUjatWagePaymentItemValuesFromOverlay(
  overlay: Record<string, unknown>
): string[] {
  return readPaymentItemIdsFromOverlay(overlay) ?? [...UJAT_DEFAULT_PAYMENT_ITEM_VALUES]
}

export function buildUjatWageOverlayPatchFromPaymentItemIds(
  paymentItemIds: string[]
): Record<string, unknown> {
  return { [UJAT_WAGE_OVERLAY_PAYMENT_KEY]: paymentItemIds }
}
