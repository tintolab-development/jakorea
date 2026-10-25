import type { Program } from '@/types/domain'
import type { CmsSelectMultipleOption } from '@/shared/ui/cms-select-multiple'
import {
  findProgramPaymentItemIdByLabel,
  getProgramWagePaymentItemOptions,
  isProgramPaymentNoneOnly,
  normalizeProgramPaymentItemSelection,
  PROGRAM_WAGE_DEDUCTION_LABEL,
  PROGRAM_WAGE_PAYMENT_ITEM_NONE_LABEL,
  PROGRAM_WAGE_PAYMENT_ITEM_NONE_VALUE,
  coerceProgramPaymentItemsText,
  programPaymentItemLabelsFromIds,
  resolveProgramPaymentItemIdsFromLabels,
  resolveProgramWageDeductionLabel,
} from '@/features/program/shared/lib/program-wage-payment-item-helpers'

/** UJAT 임금 정보 — 지급 항목「해당없음」선택값 (공유 상수 alias) */
export const UJAT_WAGE_PAYMENT_ITEM_NONE_VALUE = PROGRAM_WAGE_PAYMENT_ITEM_NONE_VALUE
export const UJAT_WAGE_PAYMENT_ITEM_NONE_LABEL = PROGRAM_WAGE_PAYMENT_ITEM_NONE_LABEL
export const UJAT_WAGE_DEDUCTION_LABEL = PROGRAM_WAGE_DEDUCTION_LABEL
export const UJAT_WAGE_OVERLAY_PAYMENT_KEY = 'ujat.wage.paymentItemValues' as const

/** 카탈로그 `강사 교통비` — UJAT 화면 표기 `교통비(일반)` */
const UJAT_PAYMENT_CATALOG_LABEL_TRANSPORT_GENERAL = '강사 교통비'
const UJAT_PAYMENT_LABEL_TRANSPORT_GENERAL = '교통비(일반)'

/** 로컬 mock 카탈로그의 `강사 교통비` id */
export const UJAT_DEFAULT_PAYMENT_ITEM_VALUES: string[] = ['p-1']

/**
 * UJAT 등록 양식 기본 지급 항목 — `교통비(일반)`.
 * 실제 목록이 있으면 항목명으로 실제 id를 고르고, 응답 전이면 mock id(화면 진입·제출 시 교정).
 */
export function resolveUjatDefaultPaymentItemValues(): string[] {
  const id = findProgramPaymentItemIdByLabel(UJAT_PAYMENT_CATALOG_LABEL_TRANSPORT_GENERAL)
  return id ? [id] : [...UJAT_DEFAULT_PAYMENT_ITEM_VALUES]
}

export type UjatWageInfoDisplay = {
  paymentItemsText: string
  deductionItemsText: string
  paymentItemIds: string[]
}

export function remapUjatWagePaymentItemOptions(
  options: readonly CmsSelectMultipleOption[]
): CmsSelectMultipleOption[] {
  return options.map(opt =>
    String(opt.label).trim() === UJAT_PAYMENT_CATALOG_LABEL_TRANSPORT_GENERAL
      ? { ...opt, label: UJAT_PAYMENT_LABEL_TRANSPORT_GENERAL }
      : opt
  )
}

export function getUjatWagePaymentItemOptions() {
  return remapUjatWagePaymentItemOptions(getProgramWagePaymentItemOptions())
}
export const isUjatPaymentNoneOnly = isProgramPaymentNoneOnly
export const resolveUjatWageDeductionLabel = resolveProgramWageDeductionLabel
export const ujatPaymentItemLabelsFromIds = programPaymentItemLabelsFromIds
export const normalizeUjatPaymentItemSelection = normalizeProgramPaymentItemSelection

function readPaymentItemIdsFromOverlay(overlay: Record<string, unknown>): string[] | undefined {
  if (!Object.prototype.hasOwnProperty.call(overlay, UJAT_WAGE_OVERLAY_PAYMENT_KEY)) {
    return undefined
  }
  const raw = overlay[UJAT_WAGE_OVERLAY_PAYMENT_KEY]
  if (!Array.isArray(raw)) return []
  return raw.filter((v): v is string => typeof v === 'string')
}

export function resolveUjatPaymentItemIdsFromProgram(
  program: Program,
  _overlayInput?: Record<string, unknown>
): string[] {
  const labels = coerceProgramPaymentItemsText(program.generalCommonInfo?.paymentItems).trim()
  if (!labels) return []

  const fromLabels = resolveProgramPaymentItemIdsFromLabels(labels)
  if (fromLabels.length > 0) return fromLabels

  const options = getUjatWagePaymentItemOptions()
  return labels
    .split(',')
    .map((s: string) => s.trim())
    .filter(Boolean)
    .map((label: string) => options.find(o => o.label === label)?.value)
    .filter((v: string | undefined): v is string => Boolean(v))
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
  overlay: Record<string, unknown>,
  options?: { fillDefaults?: boolean }
): string[] {
  return (
    readPaymentItemIdsFromOverlay(overlay) ??
    (options?.fillDefaults === false ? [] : resolveUjatDefaultPaymentItemValues())
  )
}

export function buildUjatWageOverlayPatchFromPaymentItemIds(
  paymentItemIds: string[]
): Record<string, unknown> {
  return { [UJAT_WAGE_OVERLAY_PAYMENT_KEY]: paymentItemIds }
}
